import { ApiError } from "@/core/http/api-error";
import { getOrganizationContext } from "@/core/tenancy/context";
import { createProductSchema, updateProductSchema } from "./product.schema";
import { findProductById, insertProduct, listProducts, softDeleteProductRecord, updateProductRecord } from "./product.repository";

export function getProducts(activeOnly = false) {
  return listProducts(getOrganizationContext().organizationId, activeOnly);
}

export async function getProduct(productId: number) {
  const product = await findProductById(getOrganizationContext().organizationId, productId);
  if (!product) throw new ApiError(404, "Produkti nuk u gjet.", "PRODUCT_NOT_FOUND");
  return product;
}

export async function createProduct(payload: unknown) {
  const parsed = createProductSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e produktit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  return insertProduct(getOrganizationContext().organizationId, parsed.data);
}

export async function updateProduct(productId: number, payload: unknown) {
  const parsed = updateProductSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, "Të dhënat e produktit nuk janë valide.", "VALIDATION_ERROR", parsed.error.flatten());
  await getProduct(productId);
  const updated = await updateProductRecord(getOrganizationContext().organizationId, productId, parsed.data);
  if (!updated) throw new ApiError(404, "Produkti nuk u gjet.", "PRODUCT_NOT_FOUND");
  return updated;
}

export async function deleteProduct(productId: number) {
  await getProduct(productId);
  const deleted = await softDeleteProductRecord(getOrganizationContext().organizationId, productId);
  if (!deleted) throw new ApiError(404, "Produkti nuk u gjet.", "PRODUCT_NOT_FOUND");
  return { id: productId, deleted: true };
}
