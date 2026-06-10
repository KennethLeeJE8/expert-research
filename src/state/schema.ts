export const schemaVersion = 1;

export const migrations = [
  {
    version: 1,
    name: "initial_research_state",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS papers (
        id TEXT PRIMARY KEY,
        arxiv_id TEXT UNIQUE,
        title TEXT NOT NULL,
        authors_json TEXT NOT NULL DEFAULT '[]',
        abstract TEXT,
        pdf_url TEXT,
        source_url TEXT,
        published_at TEXT,
        paper_updated_at TEXT,
        content_hash TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ingestion_jobs (
        id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL,
        input_json TEXT NOT NULL DEFAULT '{}',
        error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS relevance_scores (
        id TEXT PRIMARY KEY,
        paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
        score REAL NOT NULL,
        rationale TEXT,
        filters_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        file_path TEXT NOT NULL,
        paper_id TEXT REFERENCES papers(id) ON DELETE SET NULL,
        ask_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS review_items (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        rationale TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS eval_runs (
        id TEXT PRIMARY KEY,
        scenario TEXT NOT NULL,
        status TEXT NOT NULL,
        result_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_papers_arxiv_id ON papers(arxiv_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON ingestion_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_reports_kind ON reports(kind);
      CREATE INDEX IF NOT EXISTS idx_review_items_report ON review_items(report_id);
    `,
  },
] as const;

export type JobStatus = "queued" | "running" | "succeeded" | "failed";
export type ReportStatus = "draft" | "ready" | "reviewed" | "archived";
export type ReviewStatus = "pending" | "accepted" | "rejected" | "deferred";

export interface PaperRecord {
  id: string;
  arxivId?: string;
  title: string;
  authors: string[];
  abstract?: string;
  pdfUrl?: string;
  sourceUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  contentHash?: string;
  metadata?: Record<string, unknown>;
}

export interface ReportRecord {
  id: string;
  kind: string;
  title: string;
  filePath: string;
  paperId?: string;
  askCount: number;
  status: ReportStatus;
  metadata?: Record<string, unknown>;
}
