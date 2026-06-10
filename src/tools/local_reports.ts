import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { projectPaths } from "../config/project.ts";

export interface WriteReportInput {
  id: string;
  kind: string;
  title: string;
  content: string;
  extension?: ".md" | ".json" | ".txt";
}

export interface WrittenReport {
  id: string;
  kind: string;
  title: string;
  filePath: string;
}

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "report";
}

function assertWithinReports(path: string) {
  const relativePath = relative(projectPaths.reportsDir, path);

  if (relativePath.startsWith("..") || relativePath === "" || resolve(path) === projectPaths.reportsDir) {
    throw new Error(`Report path escapes reports directory: ${path}`);
  }
}

export function buildReportPath(input: WriteReportInput) {
  const extension = input.extension ?? ".md";
  const fileName = `${sanitizeSegment(input.id)}-${sanitizeSegment(input.title)}${extension}`;
  const filePath = resolve(projectPaths.reportsDir, sanitizeSegment(input.kind), fileName);
  assertWithinReports(filePath);
  return filePath;
}

export async function writeLocalReport(input: WriteReportInput): Promise<WrittenReport> {
  const filePath = buildReportPath(input);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, input.content, "utf8");

  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    filePath,
  };
}

export async function readLocalReport(filePath: string) {
  const resolvedPath = resolve(filePath);
  assertWithinReports(resolvedPath);
  return readFile(resolvedPath, "utf8");
}

export async function listLocalReports(kind?: string) {
  const root = kind ? join(projectPaths.reportsDir, sanitizeSegment(kind)) : projectPaths.reportsDir;
  const entries = await readdir(root, { recursive: true, withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const name = basename(entry.name);
      return {
        name,
        extension: extname(name),
        filePath: join(entry.parentPath, entry.name),
      };
    });
}
