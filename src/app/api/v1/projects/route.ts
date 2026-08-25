import { fail, ok } from "@/core/http/api-response";
import { createProject, getProjects } from "@/modules/projects/project.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return ok(await getProjects(new URL(request.url).searchParams.get("active") === "1"));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createProject(await request.json()), 201);
  } catch (error) {
    return fail(error);
  }
}

