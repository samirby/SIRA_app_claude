import { ApiError } from "@/core/http/api-error";
import { getOrganizationContext } from "@/core/tenancy/context";
import { findProductById } from "@/modules/products/product.repository";
import {
  createProjectSchema,
  projectBillingActionSchema,
  projectBlockerSchema,
  projectBlockerUpdateSchema,
  projectDocumentApprovalSchema,
  projectDocumentSchema,
  projectMilestoneSchema,
  projectMilestoneUpdateSchema,
  projectUpdateSchema,
  updateProjectSchema,
} from "./project.schema";
import {
  deleteProjectBlockerRecord,
  deleteProjectDocumentRecord,
  deleteProjectMilestoneRecord,
  deleteProjectUpdateRecord,
  getProjectDocumentFileRecord,
  insertProjectActivity,
  insertProjectBlockerRecord,
  insertProjectDocumentRecord,
  insertProjectDocumentFileRecord,
  insertProjectMilestoneRecord,
  insertProjectTemplateMilestoneRecord,
  insertProjectUpdateRecord,
  listProjectWorkspaceRecords,
  updateProjectBlockerRecord,
  updateProjectDocumentApprovalRecord,
  updateProjectMilestoneRecord,
} from "./project-workspace.repository";
import {
  countOpenProjectTasks,
  createProjectInvoiceDraftRecord,
  findProjectById,
  insertProject,
  listProjects,
  setProjectBillingState,
  softDeleteProjectRecord,
  updateProjectRecord,
} from "./project.repository";

// Çdo projekt i ri (pavarësisht llojit) merr saktësisht këto 4 faza fikse, të lidhura automatikisht
// me statuset e Kanban-it të detyrave (shih TASK_STATUS_PHASE_ORDER te task.service.ts): kur statusi
// i një detyre ndryshon, detyra kalon vetë te faza me të njëjtin sortOrder, dhe anasjelltas.
const FIXED_PROJECT_PHASES = [
  { name: "Ide", description: "Kërkesat, materialet dhe plani fillestar" },
  { name: "Ndërtim", description: "Realizimi i punës" },
  { name: "Implementim & Testim", description: "Vendosja dhe kontrolli i cilësisë" },
  { name: "Publikim & Përfundim", description: "Dorëzimi te klienti" },
] as const;

export function getProjects(activeOnly = false) {
  return listProjects(getOrganizationContext().organizationId, activeOnly);
}

export async function getProject(projectId: number) {
  const project = await findProjectById(getOrganizationContext().organizationId, projectId);
  if (!project) throw new ApiError(404, "Projekti nuk u gjet.", "PROJECT_NOT_FOUND");
  return project;
}

export async function createProject(payload: unknown) {
  const parsed = createProjectSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e projektit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  const organizationId = getOrganizationContext().organizationId;
  const product = parsed.data.productId ? await findProductById(organizationId, parsed.data.productId) : null;
  if (parsed.data.productId && !product) throw new ApiError(404, "Produkti i zgjedhur nuk u gjet.", "PRODUCT_NOT_FOUND");
  const project = await insertProject(organizationId, {
    ...parsed.data,
    productName: product?.name ?? null,
    productDescription: product?.description ?? null,
  });
  if (parsed.data.createTemplateTasks) {
    for (const [phaseIndex, phase] of FIXED_PROJECT_PHASES.entries()) {
      await insertProjectTemplateMilestoneRecord(organizationId, project.id, {
        name: phase.name, description: phase.description, status: phaseIndex === 0 ? "IN_PROGRESS" : "PLANNED",
        startDate: phaseIndex === 0 ? project.startDate : null, dueDate: project.dueDate, sortOrder: phaseIndex,
      });
    }
  }
  await insertProjectActivity(organizationId, project.id, "PROJECT_CREATED", "Projekti u krijua.", {
    clientId: project.clientId, productId: project.productId,
  });
  return getProject(project.id);
}

export async function updateProject(projectId: number, payload: unknown) {
  const parsed = updateProjectSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e projektit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  const existing = await getProject(projectId);
  if (parsed.data.status === "COMPLETED" && existing.status !== "COMPLETED") {
    throw new ApiError(409, "Përdor butonin ‘Përfundo projektin’ që të zgjidhet edhe faturimi.", "PROJECT_COMPLETION_ACTION_REQUIRED");
  }
  if (["DRAFTED", "INVOICED"].includes(existing.billingStatus)) {
    const protectedFields = ["clientId", "productId", "basePrice", "vatRate", "discountPercent"];
    if (protectedFields.some((key) => Object.prototype.hasOwnProperty.call(parsed.data, key))) {
      throw new ApiError(409, "Projekti është lidhur me faturë; vlerat financiare nuk mund të ndryshohen.", "PROJECT_IN_INVOICE");
    }
  }
  const updated = await updateProjectRecord(getOrganizationContext().organizationId, projectId, parsed.data);
  if (!updated) throw new ApiError(404, "Projekti nuk u gjet.", "PROJECT_NOT_FOUND");
  await insertProjectActivity(
    getOrganizationContext().organizationId,
    projectId,
    parsed.data.status && parsed.data.status !== existing.status ? "STATUS_CHANGED" : "PROJECT_UPDATED",
    parsed.data.status && parsed.data.status !== existing.status
      ? `Statusi ndryshoi nga ${existing.status} në ${parsed.data.status}.`
      : "Të dhënat e projektit u përditësuan.",
    parsed.data as Record<string, unknown>,
  );
  return updated;
}

export async function deleteProject(projectId: number) {
  const organizationId = getOrganizationContext().organizationId;
  const project = await getProject(projectId);
  if (project.invoiceId || ["DRAFTED", "INVOICED"].includes(project.billingStatus)) {
    throw new ApiError(409, "Projekti është i lidhur me faturë dhe nuk mund të fshihet.", "PROJECT_IN_INVOICE");
  }
  await insertProjectActivity(organizationId, projectId, "PROJECT_DELETED", "Projekti u fshi nga lista aktive.");
  const deleted = await softDeleteProjectRecord(organizationId, projectId);
  if (!deleted) throw new ApiError(404, "Projekti nuk u gjet.", "PROJECT_NOT_FOUND");
  return { id: projectId, deleted: true };
}

export async function handleProjectBilling(projectId: number, payload: unknown) {
  const parsed = projectBillingActionSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Veprimi i faturimit nuk është valid.", "VALIDATION_ERROR", parsed.error.flatten());
  const organizationId = getOrganizationContext().organizationId;
  const project = await getProject(projectId);
  if (project.status === "CANCELLED") throw new ApiError(409, "Projekti i anuluar nuk mund të përfundohet.", "PROJECT_CANCELLED");
  const openTasks = await countOpenProjectTasks(organizationId, projectId);
  if (openTasks > 0) {
    throw new ApiError(409, `Projekti ka ende ${openTasks} detyra të hapura.`, "PROJECT_HAS_OPEN_TASKS");
  }
  if (parsed.data.action === "DRAFT") {
    const updated = await createProjectInvoiceDraftRecord(organizationId, projectId);
    await insertProjectActivity(organizationId, projectId, "PROJECT_COMPLETED", "Projekti u përfundua dhe draft-fatura u krijua.");
    return updated;
  }
  const billingStatus = parsed.data.action === "QUEUE" ? "PENDING" : "NOT_BILLABLE";
  const updated = await setProjectBillingState(organizationId, projectId, billingStatus);
  if (!updated) throw new ApiError(404, "Projekti nuk u gjet.", "PROJECT_NOT_FOUND");
  await insertProjectActivity(
    organizationId,
    projectId,
    "PROJECT_COMPLETED",
    parsed.data.action === "QUEUE" ? "Projekti u përfundua dhe pret faturim." : "Projekti u përfundua pa faturim.",
  );
  return updated;
}

export async function getProjectWorkspace(projectId: number) {
  await getProject(projectId);
  return listProjectWorkspaceRecords(getOrganizationContext().organizationId, projectId);
}

export async function addProjectDocument(projectId: number, payload: unknown) {
  const parsed = projectDocumentSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e dokumentit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  await getProject(projectId);
  return insertProjectDocumentRecord(getOrganizationContext().organizationId, projectId, parsed.data);
}

const MAX_PROJECT_FILE_SIZE = 10 * 1024 * 1024;
const PROJECT_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

export async function addProjectDocumentFile(projectId: number, formData: FormData) {
  await getProject(projectId);
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const documentType = formData.get("documentType") === "DELIVERABLE" ? "DELIVERABLE" : "DOCUMENT";
  const file = formData.get("file");
  if (name.length < 2 || name.length > 190) {
    throw new ApiError(400, "Emri i dokumentit duhet të ketë 2 deri 190 karaktere.", "VALIDATION_ERROR");
  }
  if (description.length > 500) {
    throw new ApiError(400, "Përshkrimi i dokumentit është shumë i gjatë.", "VALIDATION_ERROR");
  }
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError(400, "Zgjidh një dokument për ngarkim.", "PROJECT_DOCUMENT_REQUIRED");
  }
  if (file.size > MAX_PROJECT_FILE_SIZE) {
    throw new ApiError(413, "Dokumenti nuk mund të jetë më i madh se 10 MB.", "PROJECT_DOCUMENT_TOO_LARGE");
  }
  if (file.type && !PROJECT_FILE_TYPES.has(file.type)) {
    throw new ApiError(415, "Ky format dokumenti nuk mbështetet.", "PROJECT_DOCUMENT_TYPE_NOT_ALLOWED");
  }
  const organizationId = getOrganizationContext().organizationId;
  return insertProjectDocumentFileRecord(organizationId, projectId, {
    name,
    description: description || null,
    fileName: file.name.slice(0, 255),
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    fileData: Buffer.from(await file.arrayBuffer()),
    documentType,
  });
}

export async function downloadProjectDocument(projectId: number, documentId: number) {
  await getProject(projectId);
  const file = await getProjectDocumentFileRecord(getOrganizationContext().organizationId, projectId, documentId);
  if (!file) throw new ApiError(404, "Dokumenti nuk u gjet.", "PROJECT_DOCUMENT_NOT_FOUND");
  return file;
}

export async function removeProjectDocument(projectId: number, documentId: number) {
  await getProject(projectId);
  const workspace = await deleteProjectDocumentRecord(getOrganizationContext().organizationId, projectId, documentId);
  if (!workspace) throw new ApiError(404, "Dokumenti nuk u gjet.", "PROJECT_DOCUMENT_NOT_FOUND");
  return workspace;
}

export async function updateProjectDocumentApproval(projectId: number, documentId: number, payload: unknown) {
  const parsed = projectDocumentApprovalSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Statusi i rezultatit nuk është valid.", "VALIDATION_ERROR", parsed.error.flatten());
  await getProject(projectId);
  const workspace = await updateProjectDocumentApprovalRecord(
    getOrganizationContext().organizationId, projectId, documentId, parsed.data.approvalStatus,
  );
  if (!workspace) throw new ApiError(404, "Rezultati nuk u gjet.", "PROJECT_DELIVERABLE_NOT_FOUND");
  return workspace;
}

export async function addProjectUpdate(projectId: number, payload: unknown) {
  const parsed = projectUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Të dhënat e procesit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  await getProject(projectId);
  return insertProjectUpdateRecord(getOrganizationContext().organizationId, projectId, parsed.data);
}

export async function removeProjectUpdate(projectId: number, updateId: number) {
  await getProject(projectId);
  const workspace = await deleteProjectUpdateRecord(getOrganizationContext().organizationId, projectId, updateId);
  if (!workspace) throw new ApiError(404, "Përditësimi nuk u gjet.", "PROJECT_UPDATE_NOT_FOUND");
  return workspace;
}

export async function addProjectMilestone(projectId: number, payload: unknown) {
  const parsed = projectMilestoneSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e fazës nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  await getProject(projectId);
  return insertProjectMilestoneRecord(getOrganizationContext().organizationId, projectId, parsed.data);
}

export async function updateProjectMilestone(projectId: number, milestoneId: number, payload: unknown) {
  const parsed = projectMilestoneUpdateSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e fazës nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  await getProject(projectId);
  const workspace = await updateProjectMilestoneRecord(getOrganizationContext().organizationId, projectId, milestoneId, parsed.data);
  if (!workspace) throw new ApiError(404, "Faza nuk u gjet.", "PROJECT_MILESTONE_NOT_FOUND");
  return workspace;
}

export async function removeProjectMilestone(projectId: number, milestoneId: number) {
  await getProject(projectId);
  const workspace = await deleteProjectMilestoneRecord(getOrganizationContext().organizationId, projectId, milestoneId);
  if (!workspace) throw new ApiError(404, "Faza nuk u gjet.", "PROJECT_MILESTONE_NOT_FOUND");
  return workspace;
}

export async function addProjectBlocker(projectId: number, payload: unknown) {
  const parsed = projectBlockerSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e pengesës nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  await getProject(projectId);
  return insertProjectBlockerRecord(getOrganizationContext().organizationId, projectId, parsed.data);
}

export async function updateProjectBlocker(projectId: number, blockerId: number, payload: unknown) {
  const parsed = projectBlockerUpdateSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e pengesës nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  await getProject(projectId);
  const workspace = await updateProjectBlockerRecord(getOrganizationContext().organizationId, projectId, blockerId, parsed.data);
  if (!workspace) throw new ApiError(404, "Pengesa nuk u gjet.", "PROJECT_BLOCKER_NOT_FOUND");
  return workspace;
}

export async function removeProjectBlocker(projectId: number, blockerId: number) {
  await getProject(projectId);
  const workspace = await deleteProjectBlockerRecord(getOrganizationContext().organizationId, projectId, blockerId);
  if (!workspace) throw new ApiError(404, "Pengesa nuk u gjet.", "PROJECT_BLOCKER_NOT_FOUND");
  return workspace;
}
