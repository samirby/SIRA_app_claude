import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/core/db/pool";
import type { ProductInput, ProductPackage } from "./product.types";

type ProductRow = RowDataPacket & {
  id: number; name: string; category: string; description: string | null;
  elements_json: string | null; includes_json: string | null;
  base_price: number; vat_rate: number; billing_cycle: "ONE_TIME" | "MONTHLY" | "YEARLY";
  unit_label: string; template_tasks: string | null; is_active: number | boolean;
  created_at: Date; updated_at: Date;
};
function parseList(value: string | null): string[] { if (!value) return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []; } catch { return []; } }
function mapProduct(row: ProductRow): ProductPackage {
  return { id: row.id, name: row.name, category: row.category || "Tjetër", description: row.description,
    elements: parseList(row.elements_json), includes: parseList(row.includes_json), basePrice: Number(row.base_price),
    vatRate: Number(row.vat_rate), billingCycle: row.billing_cycle || "ONE_TIME", unitLabel: row.unit_label || "Një herë",
    templateTasks: parseList(row.template_tasks), active: Boolean(row.is_active), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() };
}
const productSelect = `SELECT id, name, category, description, elements_json, includes_json, base_price, vat_rate,
  billing_cycle, unit_label, template_tasks, is_active, created_at, updated_at FROM products`;
export async function listProducts(organizationId: number, activeOnly = false): Promise<ProductPackage[]> {
  const [rows] = await getDbPool().query<ProductRow[]>(`${productSelect} WHERE organization_id = ? AND deleted_at IS NULL ${activeOnly ? "AND is_active = TRUE" : ""} ORDER BY is_active DESC, updated_at DESC, name`, [organizationId]);
  return rows.map(mapProduct);
}
export async function findProductById(organizationId: number, productId: number): Promise<ProductPackage | null> {
  const [rows] = await getDbPool().query<ProductRow[]>(`${productSelect} WHERE organization_id = ? AND id = ? AND deleted_at IS NULL LIMIT 1`, [organizationId, productId]);
  return rows[0] ? mapProduct(rows[0]) : null;
}
export async function insertProduct(organizationId: number, input: ProductInput): Promise<ProductPackage> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `INSERT INTO products (organization_id, name, category, description, elements_json, includes_json, base_price, vat_rate, billing_cycle, unit_label, template_tasks, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [organizationId, input.name, input.category, input.description ?? null, JSON.stringify(input.elements ?? []), JSON.stringify(input.includes ?? []), input.basePrice, input.vatRate, input.billingCycle, input.unitLabel, JSON.stringify(input.templateTasks ?? []), input.active === false ? 0 : 1],
  );
  const product = await findProductById(organizationId, result.insertId); if (!product) throw new Error("Product was created but could not be loaded."); return product;
}
export async function updateProductRecord(organizationId: number, productId: number, input: Partial<ProductInput>): Promise<ProductPackage | null> {
  const mapping: Record<string,string> = { name:"name", category:"category", description:"description", elements:"elements_json", includes:"includes_json", basePrice:"base_price", vatRate:"vat_rate", billingCycle:"billing_cycle", unitLabel:"unit_label", templateTasks:"template_tasks", active:"is_active" };
  const fields:string[]=[]; const values:Array<string|number|null>=[];
  for (const [key,column] of Object.entries(mapping)) { if (!Object.prototype.hasOwnProperty.call(input,key)) continue; fields.push(`${column} = ?`); const raw=input[key as keyof ProductInput]; values.push(["elements","includes","templateTasks"].includes(key) ? JSON.stringify(raw ?? []) : typeof raw === "boolean" ? (raw ? 1 : 0) : raw as string|number|null); }
  if (!fields.length) return findProductById(organizationId, productId); values.push(organizationId, productId);
  await getDbPool().execute(`UPDATE products SET ${fields.join(", ")} WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`, values);
  return findProductById(organizationId, productId);
}

export async function softDeleteProductRecord(organizationId: number, productId: number): Promise<boolean> {
  const [result] = await getDbPool().execute<ResultSetHeader>(
    `UPDATE products SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE WHERE organization_id = ? AND id = ? AND deleted_at IS NULL`,
    [organizationId, productId],
  );
  return result.affectedRows > 0;
}
