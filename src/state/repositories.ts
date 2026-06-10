import type { DatabaseSync } from "node:sqlite";
import type { PaperRecord, ReportRecord, ReportStatus } from "./schema.ts";

function json(value: unknown) {
  return JSON.stringify(value ?? {});
}

function optionalString(value: string | undefined) {
  return value ?? null;
}

export function createStateRepositories(db: DatabaseSync) {
  return {
    upsertPaper(paper: PaperRecord) {
      db.prepare(`
        INSERT INTO papers (
          id, arxiv_id, title, authors_json, abstract, pdf_url, source_url,
          published_at, paper_updated_at, content_hash, metadata_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          arxiv_id = excluded.arxiv_id,
          title = excluded.title,
          authors_json = excluded.authors_json,
          abstract = excluded.abstract,
          pdf_url = excluded.pdf_url,
          source_url = excluded.source_url,
          published_at = excluded.published_at,
          paper_updated_at = excluded.paper_updated_at,
          updated_at = CURRENT_TIMESTAMP,
          content_hash = excluded.content_hash,
          metadata_json = excluded.metadata_json
      `).run(
        paper.id,
        optionalString(paper.arxivId),
        paper.title,
        JSON.stringify(paper.authors),
        optionalString(paper.abstract),
        optionalString(paper.pdfUrl),
        optionalString(paper.sourceUrl),
        optionalString(paper.publishedAt),
        optionalString(paper.updatedAt),
        optionalString(paper.contentHash),
        json(paper.metadata)
      );
    },

    insertReport(report: ReportRecord) {
      db.prepare(`
        INSERT INTO reports (
          id, kind, title, file_path, paper_id, ask_count, status, metadata_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        report.id,
        report.kind,
        report.title,
        report.filePath,
        optionalString(report.paperId),
        report.askCount,
        report.status,
        json(report.metadata)
      );
    },

    markReportStatus(reportId: string, status: ReportStatus) {
      db.prepare("UPDATE reports SET status = ? WHERE id = ?").run(status, reportId);
    },
  };
}
