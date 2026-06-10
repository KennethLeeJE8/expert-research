import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { env } from "../config/env.ts";
import { projectPaths } from "../config/project.ts";

export interface WorkflowMemoryEvent {
  id: string;
  type: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

const memoryLogPath = join(projectPaths.memoryDir, "mem9-events.jsonl");

export async function recordWorkflowMemory(event: WorkflowMemoryEvent) {
  if (!env.memory.mem9Enabled) {
    return;
  }

  await mkdir(projectPaths.memoryDir, { recursive: true });
  const record = {
    ...event,
    context: env.memory.mem9Context,
    createdAt: event.createdAt ?? new Date().toISOString(),
  };

  await appendFile(memoryLogPath, `${JSON.stringify(record)}\n`, "utf8");
}

export async function readWorkflowMemoryLog() {
  try {
    const content = await readFile(memoryLogPath, "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as WorkflowMemoryEvent);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}
