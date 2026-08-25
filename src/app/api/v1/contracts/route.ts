import { fail, ok } from "@/core/http/api-response";
import { createContract, getContracts } from "@/modules/contracts/contract.service";
export const dynamic = "force-dynamic";
export async function GET() { try { return ok(await getContracts()); } catch (error) { return fail(error); } }
export async function POST(request: Request) { try { return ok(await createContract(await request.json()), 201); } catch (error) { return fail(error); } }
