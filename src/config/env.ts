import "dotenv/config";
import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => value === "" ? undefined : value;

const optionalPath = z.preprocess(emptyStringToUndefined, z.string().min(1).optional());

const optionalUrl = z.preprocess(emptyStringToUndefined, z.string().url().optional());

const positiveInteger = (defaultValue: number) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === "") {
        return defaultValue;
      }

      return Number(value);
    },
    z.number().int().positive()
  );

const booleanFromEnv = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === "") {
      return defaultValue;
    }

    if (typeof value === "string") {
      return ["1", "true", "yes", "on"].includes(value.toLowerCase());
    }

    return value;
  }, z.boolean());

const envSchema = z.object({
  OTEL_SERVICE_NAME: z.string().min(1).default("expert-research"),
  OTEL_TRACES_EXPORTER: z.preprocess(
    emptyStringToUndefined,
    z.enum(["none", "console", "otlp"]).optional()
  ),
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl,
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: optionalUrl,

  EXPERT_RESEARCH_DATA_DIR: z.string().min(1).default(".expert-research"),
  EXPERT_RESEARCH_REPORTS_DIR: z.string().min(1).default("reports"),
  EXPERT_RESEARCH_DB_PATH: optionalPath,
  EXPERT_RESEARCH_PROJECT_CONFIG: z.string().min(1).default("research.config.json"),
  EXPERT_RESEARCH_MAX_DIFF_ASKS: positiveInteger(10).pipe(z.number().max(10)),

  OBSIDIAN_VAULT_PATH: optionalPath,
  MEM9_ENABLED: booleanFromEnv(true),
  MEM9_CONTEXT: z.string().min(1).default("expert-research"),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  otel: {
    serviceName: parsedEnv.OTEL_SERVICE_NAME,
    tracesExporter: parsedEnv.OTEL_TRACES_EXPORTER,
    exporterOtlpEndpoint: parsedEnv.OTEL_EXPORTER_OTLP_ENDPOINT,
    exporterOtlpTracesEndpoint: parsedEnv.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  },
  project: {
    dataDir: parsedEnv.EXPERT_RESEARCH_DATA_DIR,
    reportsDir: parsedEnv.EXPERT_RESEARCH_REPORTS_DIR,
    configPath: parsedEnv.EXPERT_RESEARCH_PROJECT_CONFIG,
    maxDiffAsks: parsedEnv.EXPERT_RESEARCH_MAX_DIFF_ASKS,
  },
  state: {
    dbPath: parsedEnv.EXPERT_RESEARCH_DB_PATH,
  },
  obsidian: {
    vaultPath: parsedEnv.OBSIDIAN_VAULT_PATH,
  },
  memory: {
    mem9Enabled: parsedEnv.MEM9_ENABLED,
    mem9Context: parsedEnv.MEM9_CONTEXT,
  },
} as const;

export type Env = typeof env;
