import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { projectPaths } from "../config/project.ts";

export interface PaperHistoryEntry {
  paperId: string;
  action: "pulled" | "parsed" | "analyzed" | "reported" | "reviewed";
  summary: string;
  reportId?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

const paperHistoryPath = join(projectPaths.memoryDir, "paper-history.jsonl");

export async function appendPaperHistory(entry: PaperHistoryEntry) {
  await mkdir(projectPaths.memoryDir, { recursive: true });
  const record = {
    ...entry,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };

  await appendFile(paperHistoryPath, `${JSON.stringify(record)}\n`, "utf8");
}

export async function readPaperHistory(limit = 50) {
  try {
    const content = await readFile(paperHistoryPath, "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as PaperHistoryEntry)
      .slice(-limit);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}
