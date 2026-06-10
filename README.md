# Expert Research

Minimal TypeScript infrastructure for a local-first research partner agent.

This scaffold intentionally starts with infrastructure only:

- validated environment and project paths
- root-level local `reports/` output
- OpenTelemetry bootstrap
- local SQLite schema helpers using Node's built-in `node:sqlite`
- lightweight memory and paper-history logs

Agent prompts, specialist agent orchestration, and SDK tool wiring are left for the next implementation pass.

Requires Node 24 or newer for the built-in `node:sqlite` module.

## Commands

```bash
npm install
npm run init
npm run doctor
npm run typecheck
npm run eval
```

Generated runtime data is written under `.expert-research/`. Generated reports are written under `reports/`.
