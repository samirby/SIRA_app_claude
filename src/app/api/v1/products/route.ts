import { fail, ok } from "@/core/http/api-response";
import { createProduct, getProducts } from "@/modules/products/product.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { return ok(await getProducts(new URL(request.url).searchParams.get("active") === "1")); }
  catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try { return ok(await createProduct(await request.json()), 201); }
  catch (error) { return fail(error); }
}
