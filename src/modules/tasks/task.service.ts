import { ApiError } from "@/core/http/api-error";
import { getOrganizationContext } from "@/core/tenancy/context";
import { findProjectMilestoneRecord } from "@/modules/projects/project-workspace.repository";
import { updateProjectMilestone } from "@/modules/projects/project.service";
import { createTaskSchema, labelSchema, taskExtraCostSchema, taskNoteSchema, taskTimeSchema, updateTaskSchema } from "./task.schema";
import {
  addTaskExtraCostRecord,
  addTaskNoteRecord,
  addTaskTimeRecord,
  countOpenTasksInMilestone,
  createLabelDefinition,
  deleteLabelDefinition,
  deleteTaskExtraCostRecord,
  deleteTaskTimeRecord,
  findTaskById,
  insertTask,
  listLabelDefinitions,
  listTasks,
  setTaskBillingQueue,
  softDeleteTaskRecord,
  updateLabelDefinition,
  updateTaskRecord,
} from "./task.repository";
import type { TaskFilters, TaskStatus } from "./task.types";

export async function getTasks(filters: TaskFilters = {}) {
  return listTasks(getOrganizationContext().organizationId, filters);
}

async function syncMilestoneStatusFromTaskStatus(organizationId: number, projectMilestoneId: number, taskStatus: TaskStatus) {
  if (taskStatus !== "IN_PROGRESS" && taskStatus !== "COMPLETED") return;
  const milestone = await findProjectMilestoneRecord(organizationId, projectMilestoneId);
  if (!milestone || milestone.status === "COMPLETED") return;
  if (taskStatus === "IN_PROGRESS") {
    if (milestone.status === "PLANNED") {
      await updateProjectMilestone(milestone.projectId, milestone.id, { status: "IN_PROGRESS" });
    }
    return;
  }
  const openTasks = await countOpenTasksInMilestone(organizationId, projectMilestoneId);
  if (openTasks === 0) {
    await updateProjectMilestone(milestone.projectId, milestone.id, { status: "COMPLETED" });
  }
}

export async function getTask(taskId: number) {
  const task = await findTaskById(getOrganizationContext().organizationId, taskId);
  if (!task) throw new ApiError(404, "Detyra nuk u gjet.", "TASK_NOT_FOUND");
  return task;
}

export async function createTask(payload: unknown) {
  const parsed = createTaskSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Të dhënat e detyrës nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  if (parsed.data.subjectType === "PERSON" && parsed.data.billable) {
    throw new ApiError(400, "Për faturim, personi duhet të regjistrohet si klient.", "PERSON_NOT_BILLABLE");
  }
  if (parsed.data.projectId && (parsed.data.projectBillingType === "EXTRA_BILLABLE") !== parsed.data.billable) {
    throw new ApiError(400, "Lloji i faturimit të detyrës nuk përputhet me projektin.", "PROJECT_TASK_BILLING_MISMATCH");
  }
  const organizationId = getOrganizationContext().organizationId;
  if (parsed.data.projectMilestoneId) {
    if (!parsed.data.projectId) throw new ApiError(400, "Faza kërkon një projekt.", "TASK_PHASE_REQUIRES_PROJECT");
    const milestone = await findProjectMilestoneRecord(organizationId, parsed.data.projectMilestoneId);
    if (!milestone || milestone.projectId !== parsed.data.projectId) {
      throw new ApiError(400, "Faza e zgjedhur nuk i përket këtij projekti.", "TASK_PHASE_PROJECT_MISMATCH");
    }
  }
  const task = await insertTask(organizationId, parsed.data);
  if (parsed.data.projectMilestoneId) {
    await syncMilestoneStatusFromTaskStatus(organizationId, parsed.data.projectMilestoneId, parsed.data.status);
  }
  return task;
}

export async function updateTask(taskId: number, payload: unknown) {
  const parsed = updateTaskSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Të dhënat e detyrës nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  const current = await getTask(taskId);
  const subjectType = parsed.data.subjectType ?? current.subjectType;
  const clientId = Object.prototype.hasOwnProperty.call(parsed.data, "clientId") ? parsed.data.clientId : current.clientId;
  const personName = Object.prototype.hasOwnProperty.call(parsed.data, "personName") ? parsed.data.personName : current.personName;
  const projectId = Object.prototype.hasOwnProperty.call(parsed.data, "projectId") ? parsed.data.projectId : current.projectId;
  const projectMilestoneId = (Object.prototype.hasOwnProperty.call(parsed.data, "projectMilestoneId")
    ? parsed.data.projectMilestoneId : current.projectMilestoneId) as number | null | undefined;
  const projectBillingType = parsed.data.projectBillingType ?? current.projectBillingType;
  const billable = parsed.data.billable ?? current.billable;
  if ((subjectType === "CLIENT" && !clientId) || (subjectType === "PERSON" && !personName)) {
    throw new ApiError(400, "Detyra duhet të lidhet me klient ose person.", "TASK_SUBJECT_REQUIRED");
  }
  if (subjectType === "PERSON" && (parsed.data.billable ?? current.billable)) {
    throw new ApiError(400, "Për faturim, personi duhet të regjistrohet si klient.", "PERSON_NOT_BILLABLE");
  }
  if (projectId && (projectBillingType === "EXTRA_BILLABLE") !== billable) {
    throw new ApiError(400, "Lloji i faturimit të detyrës nuk përputhet me projektin.", "PROJECT_TASK_BILLING_MISMATCH");
  }
  if (projectMilestoneId) {
    if (!projectId) throw new ApiError(400, "Faza kërkon një projekt.", "TASK_PHASE_REQUIRES_PROJECT");
    const milestone = await findProjectMilestoneRecord(getOrganizationContext().organizationId, projectMilestoneId);
    if (!milestone || milestone.projectId !== projectId) {
      throw new ApiError(400, "Faza e zgjedhur nuk i përket këtij projekti.", "TASK_PHASE_PROJECT_MISMATCH");
    }
  }
  if (["DRAFTED", "INVOICED"].includes(current.billingStatus)) {
    const changesBilling = ["billable", "projectBillingType", "billingType", "invoiceDescription", "quantity", "unitPrice", "vatRate", "discountPercent"]
      .some((key) => Object.prototype.hasOwnProperty.call(parsed.data, key));
    if (changesBilling || (parsed.data.status && parsed.data.status !== "COMPLETED")) {
      throw new ApiError(409, "Detyra është e lidhur me një faturë dhe nuk mund të ndryshohet në këtë mënyrë.", "TASK_IN_INVOICE");
    }
  }
  if (current.billingStatus === "PENDING" && parsed.data.status && parsed.data.status !== "COMPLETED") {
    await setTaskBillingQueue(getOrganizationContext().organizationId, taskId, false);
  }
  const updated = await updateTaskRecord(getOrganizationContext().organizationId, taskId, parsed.data);
  if (!updated) throw new ApiError(404, "Detyra nuk u gjet.", "TASK_NOT_FOUND");
  if (projectMilestoneId && parsed.data.status) {
    await syncMilestoneStatusFromTaskStatus(getOrganizationContext().organizationId, projectMilestoneId, parsed.data.status as TaskStatus);
  }
  return updated;
}

export async function deleteTask(taskId: number) {
  const current = await getTask(taskId);
  if (["DRAFTED", "INVOICED"].includes(current.billingStatus) || current.invoiceId) {
    throw new ApiError(409, "Detyra është e lidhur me një faturë dhe nuk mund të fshihet.", "TASK_IN_INVOICE");
  }
  const deleted = await softDeleteTaskRecord(getOrganizationContext().organizationId, taskId);
  if (!deleted) throw new ApiError(404, "Detyra nuk u gjet.", "TASK_NOT_FOUND");
  return { id: taskId };
}

export async function queueTaskForBilling(taskId: number, queued: boolean) {
  const current = await getTask(taskId);
  if (current.projectId) {
    throw new ApiError(409, "Kjo detyrë faturohet përmes projektit.", "TASK_BILLED_BY_PROJECT");
  }
  if (!current.clientId) {
    throw new ApiError(409, "Për faturim, detyra duhet të jetë e lidhur me klient.", "TASK_CLIENT_REQUIRED");
  }
  if (!current.billable && current.billableExtraCostTotal <= 0) {
    throw new ApiError(409, "Kjo detyrë nuk ka punë ose shpenzime për faturim.", "TASK_NOT_BILLABLE");
  }
  if (queued && current.status !== "COMPLETED") {
    throw new ApiError(409, "Vetëm detyrat e përfunduara mund të kalojnë për faturim.", "TASK_NOT_COMPLETED");
  }
  const changed = await setTaskBillingQueue(getOrganizationContext().organizationId, taskId, queued);
  if (!changed) {
    throw new ApiError(409, "Statusi i faturimit nuk lejon këtë veprim.", "BILLING_STATUS_CONFLICT");
  }
  return getTask(taskId);
}

export async function addTaskTime(taskId: number, payload: unknown) {
  await getTask(taskId);
  const parsed = taskTimeSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Koha e punës nuk është valide.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  let minutes = 0;
  if (typeof parsed.data.hours === "number") {
    minutes = Math.round(parsed.data.hours * 60);
  } else {
    const [startHour, startMinute] = parsed.data.startTime!.split(":").map(Number);
    const [endHour, endMinute] = parsed.data.endTime!.split(":").map(Number);
    minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  }
  const task = await addTaskTimeRecord(getOrganizationContext().organizationId, taskId, {
    workDate: parsed.data.workDate,
    startTime: parsed.data.startTime ?? null,
    endTime: parsed.data.endTime ?? null,
    minutes,
    note: parsed.data.note ?? null,
  });
  if (!task) throw new ApiError(404, "Detyra nuk u gjet.", "TASK_NOT_FOUND");
  return task;
}

export async function deleteTaskTime(taskId: number, entryId: number) {
  await getTask(taskId);
  const task = await deleteTaskTimeRecord(getOrganizationContext().organizationId, taskId, entryId);
  if (!task) throw new ApiError(404, "Regjistrimi i kohës nuk u gjet.", "TIME_ENTRY_NOT_FOUND");
  return task;
}

export async function addTaskNote(taskId: number, payload: unknown) {
  await getTask(taskId);
  const parsed = taskNoteSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Shënimi nuk është valid.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  const task = await addTaskNoteRecord(getOrganizationContext().organizationId, taskId, parsed.data.note);
  if (!task) throw new ApiError(404, "Detyra nuk u gjet.", "TASK_NOT_FOUND");
  return task;
}

export async function addTaskExtraCost(taskId: number, payload: unknown) {
  const current = await getTask(taskId);
  const parsed = taskExtraCostSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Kostoja shtesë nuk është valide.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  if (parsed.data.costType === "CLIENT" && !current.clientId) {
    throw new ApiError(409, "Për faturim, detyra duhet të jetë e lidhur me klient.", "TASK_CLIENT_REQUIRED");
  }
  if (parsed.data.costType === "CLIENT" && ["DRAFTED", "INVOICED"].includes(current.billingStatus)) {
    throw new ApiError(409, "Fatura është krijuar; nuk mund të shtosh më kosto për klientin.", "TASK_IN_INVOICE");
  }
  const task = await addTaskExtraCostRecord(getOrganizationContext().organizationId, taskId, parsed.data);
  if (!task) throw new ApiError(404, "Detyra nuk u gjet.", "TASK_NOT_FOUND");
  return task;
}

export async function deleteTaskExtraCost(taskId: number, costId: number) {
  const current = await getTask(taskId);
  const cost = current.extraCosts.find((item) => item.id === costId);
  if (cost?.costType === "CLIENT" && ["DRAFTED", "INVOICED"].includes(current.billingStatus)) {
    throw new ApiError(409, "Fatura është krijuar; kjo kosto për klientin nuk mund të fshihet.", "TASK_IN_INVOICE");
  }
  const task = await deleteTaskExtraCostRecord(getOrganizationContext().organizationId, taskId, costId);
  if (!task) throw new ApiError(404, "Kostoja shtesë nuk u gjet.", "EXTRA_COST_NOT_FOUND");
  return task;
}

export function getLabels() {
  return listLabelDefinitions(getOrganizationContext().organizationId);
}

export async function createLabel(payload: unknown) {
  const parsed = labelSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Label nuk është valid.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  return createLabelDefinition(getOrganizationContext().organizationId, parsed.data.name, parsed.data.color.toUpperCase());
}

export async function updateLabel(labelId: number, payload: unknown) {
  const parsed = labelSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "Label nuk është valid.", "VALIDATION_ERROR", parsed.error.flatten());
  }
  const organizationId = getOrganizationContext().organizationId;
  const labels = await listLabelDefinitions(organizationId);
  if (labels.some((label) => label.id !== labelId && label.name.toLowerCase() === parsed.data.name.toLowerCase())) {
    throw new ApiError(409, "Ekziston një label me këtë emër.", "LABEL_NAME_EXISTS");
  }
  const label = await updateLabelDefinition(organizationId, labelId, parsed.data.name, parsed.data.color.toUpperCase());
  if (!label) throw new ApiError(404, "Label nuk u gjet.", "LABEL_NOT_FOUND");
  return label;
}

export async function deleteLabel(labelId: number) {
  const deleted = await deleteLabelDefinition(getOrganizationContext().organizationId, labelId);
  if (!deleted) throw new ApiError(404, "Label nuk u gjet.", "LABEL_NOT_FOUND");
  return { id: labelId };
}
