import { mkdir } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { env } from "./env.ts";

const projectRoot = process.cwd();

export function resolveProjectPath(path: string) {
  return isAbsolute(path) ? path : resolve(projectRoot, path);
}

const dataDir = resolveProjectPath(env.project.dataDir);
const reportsDir = resolveProjectPath(env.project.reportsDir);
const dbPath = env.state.dbPath
  ? resolveProjectPath(env.state.dbPath)
  : join(dataDir, "state.sqlite");

export const projectPaths = {
  root: projectRoot,
  dataDir,
  reportsDir,
  dbPath,
  projectConfigPath: resolveProjectPath(env.project.configPath),
  memoryDir: join(dataDir, "memory"),
} as const;

export async function ensureProjectDirectories() {
  await mkdir(projectPaths.dataDir, { recursive: true });
  await mkdir(projectPaths.memoryDir, { recursive: true });
  await mkdir(projectPaths.reportsDir, { recursive: true });
  await mkdir(dirname(projectPaths.dbPath), { recursive: true });
}
