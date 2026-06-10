import { pathToFileURL } from "node:url";
import { ensureProjectDirectories, projectPaths } from "./config/project.ts";
import { closeDatabase, getDatabase } from "./state/db.ts";
import { traceInfrastructure } from "./observability/telemetry.ts";

async function init() {
  await traceInfrastructure("init", async () => {
    await ensureProjectDirectories();
    getDatabase();
  });
}

async function doctor() {
  await ensureProjectDirectories();
  const db = getDatabase();
  const migrationCount = db.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get() as {
    count: number;
  };

  console.log(JSON.stringify({
    root: projectPaths.root,
    dataDir: projectPaths.dataDir,
    reportsDir: projectPaths.reportsDir,
    dbPath: projectPaths.dbPath,
    migrations: migrationCount.count,
  }, null, 2));
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case "init":
        await init();
        console.log(`Initialized expert-research infrastructure at ${projectPaths.dataDir}`);
        break;
      case "doctor":
        await doctor();
        break;
      default:
        console.error("Usage: tsx src/index.ts <init|doctor>");
        process.exitCode = 1;
    }
  } finally {
    closeDatabase();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
