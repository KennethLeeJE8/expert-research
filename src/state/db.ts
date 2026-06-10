import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { projectPaths } from "../config/project.ts";
import { migrations } from "./schema.ts";

let singleton: DatabaseSync | undefined;

export function openDatabase(dbPath = projectPaths.dbPath) {
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  return db;
}

export function migrateDatabase(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  for (const migration of migrations) {
    const existing = db
      .prepare("SELECT version FROM schema_migrations WHERE version = ?")
      .get(migration.version);

    if (!existing) {
      db.exec(migration.sql);
      db.prepare("INSERT INTO schema_migrations (version, name) VALUES (?, ?)").run(
        migration.version,
        migration.name
      );
    }
  }
}

export function getDatabase() {
  singleton ??= openDatabase();
  migrateDatabase(singleton);
  return singleton;
}

export function closeDatabase() {
  singleton?.close();
  singleton = undefined;
}
