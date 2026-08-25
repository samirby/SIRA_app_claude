import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  APP_NAME: z.string().min(1).default("SIRA Business Manager"),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  RELEASE_CHANNEL: z.enum(["development","preview","stable"]).default("development"),
  APP_URL: z.string().url().optional(),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DEFAULT_ORGANIZATION_SLUG: z.string().min(1).default("sira-solutions"),
  LOG_LEVEL: z.enum(["debug","info","warn","error"]).default("info")
});

export type Environment = z.infer<typeof schema>;
let cached: Environment | undefined;

export function getEnvironment(): Environment {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  cached = parsed.data;
  return cached;
}
