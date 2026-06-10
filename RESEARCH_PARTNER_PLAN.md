# Research Partner Agent Plan

## Summary

Build a local-first TypeScript research partner agent with CLI and HTTP API entrypoints, using the Claude Agent SDK as the base agent runtime. The agent ingests arXiv papers, reads the user's Obsidian vault as the primary worldview context, uses prior academic-paper summaries stored in Drive9 as reference material, evaluates relevance, summarizes and critiques papers, compares paper analysis against the user's current worldview, and outputs a capped diff report for review.

The current `expert-research` workspace starts as a blank planning target. This document is only the project plan; it does not scaffold or start the project.

## Core Intent

The agent should act as a niche research partner, not a generic paper summarizer. It should:

- Pull relevant academic papers from arXiv by tag, author, keyword, and metadata filters.
- Summarize and explain academic papers clearly.
- Extract the paper's claims, methods, evidence, limitations, innovations, and assumptions.
- Read the user's Obsidian notes as the user's personal stance, reasoning history, preferences, open questions, and sentiments.
- Compare academic paper analysis against the user's worldview from Obsidian.
- Critique the user's existing stance when the paper provides stronger evidence or exposes a flaw.
- Build on the user's Obsidian points when the paper extends, supports, or refines an existing idea.
- Identify what is shocking, novel, missing, weak, or in conflict with the current worldview.
- Keep a traceable log of paper summaries, worldview comparisons, diff reports, and review asks.

## Key Design Boundaries

- Obsidian is the user's worldview source of truth.
  - The agent may read markdown notes from a configured local vault path.
  - The agent treats those notes as the user's current worldview, prior reasoning, preferences, open questions, and sentiments.
  - The agent must never write its own perspective, summaries, or decisions back into the user's personal Obsidian vault in v1.
- The agent does not maintain a separate worldview.
  - There is no agent-owned canonical worldview folder in Drive9.
  - Drive9 stores academic-paper summaries, parsed paper references, diff reports, and interaction records.
  - The Worldview Compiler Agent constructs the current worldview from Obsidian plus relevant prior academic-paper summaries stored in Drive9.
  - Local SQLite stores operational indexes, job state, evidence links, and review status.
- Diff reports should limit review burden.
  - Each diff report may contain at most 10 explicit asks for the user to accept, reject, or defer.
  - If there are more than 10 candidate asks, the Coordinator Agent ranks them by evidence strength, relevance, novelty, and potential impact on the user's worldview.
- OpenRouter powers the model layer.
  - OpenRouter is the required provider interface for v1.
  - DeepSeek V4 Pro is the default strong reasoning model.
  - Model routing should be configurable by task.
- Claude Agent SDK is the implementation base.
  - Use the TypeScript Claude Agent SDK as the base runtime for agent orchestration, tool calling, and CLI/API integration.
  - Consult the current SDK reference during development: https://github.com/anthropics/claude-agent-sdk-typescript
  - Use the official Agent SDK docs linked from that repository for concrete API behavior.
  - Implement arXiv, Obsidian, Drive9, mem9, persistence, and evaluation capabilities as tools/services around that runtime.
  - Keep OpenRouter as the required model provider layer for the research agent's LLM calls.

## Agent Hierarchy

The system should be organized as a small hierarchy of Claude Agent SDK agents. The coordinator agent is the only agent exposed directly to the CLI/API. Specialist agents are invoked by the coordinator as tools.

- Coordinator Agent:
  - Owns the user-facing task flow.
  - Receives CLI/API requests such as pull, analyze, review, and worldview.
  - Calls the Researcher Agent, Worldview Compiler Agent, and Analysis Agent as tools.
  - Maintains run state, routes outputs between agents, enforces the 10-ask cap, and records traceability metadata.
  - Outputs a diff report that records the paper summary, personal worldview summary, analytical differences, and consolidated current-worldview snapshot for this interaction.
  - Does not directly perform paper search, Obsidian synthesis, or analytical comparison when a specialist agent is responsible for that task.
- Researcher Agent:
  - Searches for relevant arXiv papers through `arxiv-api`.
  - Uses project config filters such as tags, authors, keywords, date windows, arXiv categories, and relevance criteria.
  - Fetches PDFs, parses paper text, and summarizes papers.
  - Extracts claims, methods, evidence, limitations, assumptions, novelty, and missing context.
  - Can follow the recursive query/refinement pattern from the sibling `deep-research` example for deeper paper discovery and follow-up search.
  - Produces a structured research packet for each paper or paper set.
- Worldview Compiler Agent:
  - Reads the configured Obsidian vault as read-only input.
  - Reads relevant prior academic-paper summaries from Drive9.
  - Summarizes the user's current worldview, prior reasoning, sentiments, assumptions, preferences, open questions, and method preferences.
  - Treats Obsidian as the user's worldview source of truth and uses Drive9 paper summaries as supporting academic reference material.
  - Produces a structured current-worldview packet with source note paths, relevant prior paper-summary references, and extracted claims.
- Analysis Agent:
  - Takes two primary inputs: the Researcher Agent's research packet and the Worldview Compiler Agent's current-worldview packet.
  - Compares academic evidence against the user's worldview.
  - Identifies agreements, extensions, contradictions, outdated assumptions, missing caveats, and places where the user's stance may be wrong or underspecified.
  - Produces an analytical difference packet for the Coordinator Agent to include in the diff report.
  - Keeps the packet's explicit user asks to 10 or fewer.
  - Does not directly commit worldview changes; it only prepares the comparison and recommendation for the interaction record.

## First Interfaces

- CLI first, with an HTTP API over the same core services.
- CLI commands:
  - `init`: run onboarding and create editable project config.
  - `pull`: query arXiv by tags, authors, keywords, date windows, and configured field profile.
  - `analyze <paper-id>`: parse, summarize, critique, and compare a paper against the user's current worldview compiled from Obsidian and relevant Drive9 paper summaries.
  - `review`: inspect a diff report and mark up to 10 asks as accepted, rejected, or deferred.
  - `worldview`: inspect the current worldview snapshot compiled from Obsidian plus relevant Drive9 paper summaries.
  - `eval`: run fixed evaluation scenarios.
- API endpoints:
  - `POST /api/projects/init`
  - `POST /api/papers/pull`
  - `POST /api/papers/:id/analyze`
  - `GET /api/diff-reports`
  - `GET /api/diff-reports/:id`
  - `POST /api/diff-reports/:id/asks/:askId/mark`
  - `GET /api/worldview`
  - `POST /api/evals/run`

## Onboarding And Configuration

The first run should guide the user through project setup, then save an editable config file. The user can also manually fill or edit the config.

The onboarding should capture:

- Niche field of study.
- Core topics and subtopics.
- Inclusion and exclusion criteria.
- Preferred methods and evaluation standards.
- Important authors, labs, venues, and schools of thought.
- arXiv categories, keywords, and metadata filters.
- Recency window and temporal weighting policy.
- Known beliefs, assumptions, and open questions.
- Desired strictness for relevance filtering.
- Task-to-model routing through OpenRouter.

## Research Flow

1. The Coordinator Agent receives a pull or analyze request from the CLI/API.
2. The Coordinator Agent invokes the Researcher Agent to pull candidate papers from arXiv using `arxiv-api` and project config filters.
3. The Researcher Agent fetches arXiv PDFs and parses text into stable sections and chunks.
4. The Researcher Agent scores relevance using configured field criteria, metadata, abstract, parsed content, and optionally the user's Obsidian-derived stance.
5. For relevant papers, the Researcher Agent generates a structured research packet containing:
   - General summary.
   - Concept explanation.
   - Methods and experimental setup.
   - Key claims and evidence.
   - Limitations and missing context.
   - Novel or surprising contributions.
6. The Coordinator Agent invokes the Worldview Compiler Agent to read Obsidian, retrieve relevant prior academic-paper summaries from Drive9, and produce a current-worldview packet.
7. The Coordinator Agent invokes the Analysis Agent with the research packet and current-worldview packet.
8. The Analysis Agent compares extracted claims and methods against:
   - The user's Obsidian-derived worldview.
   - Relevant prior academic-paper summaries stored in Drive9.
   - Prior diff reports and interaction records where relevant.
9. The Analysis Agent produces an analytical difference packet covering:
   - Conflicts with the user's Obsidian worldview.
   - Ways the paper supports, refines, or extends the user's existing notes.
   - Points where the user's stance may be wrong, outdated, underspecified, or missing important caveats.
   - Up to 10 recommended accept, reject, or defer asks.
10. The Coordinator Agent writes a diff report for the interaction.
11. The diff report includes:
   - Researcher Agent paper summaries and extracted claims.
   - Worldview Compiler Agent summary of the user's current worldview compiled from Obsidian plus relevant Drive9 paper summaries.
   - Analysis Agent analytical difference packet.
   - A consolidated current-worldview snapshot that reflects the state of understanding after the comparison.
   - No more than 10 explicit accept, reject, or defer asks for later user review.
12. The Coordinator Agent stores the diff report in Drive9 and records local metadata in SQLite. It does not maintain or mutate a separate agent-owned worldview.

## Memory And Persistence

- mem9:
  - Stores user workflow preferences, repeated research habits, and interaction preferences.
  - Does not serve as the canonical research truth store.
- Drive9:
  - Stores parsed academic papers and academic-paper summaries for future reference.
  - Stores diff reports that record each research interaction and current-worldview consolidation snapshot.
  - Stores append-only research and interaction journals.
  - Does not store a separate agent-owned worldview.
- SQLite:
  - Stores local operational state, paper index, job status, hashes, relevance scores, evidence references, diff report metadata, diff ask review status, and eval run metadata.

Suggested Drive9 layout:

```text
:/research-partner/<project>/
  papers/
  paper-summaries/
  diff-reports/
  synthesis/
  evals/
```

## Model Routing

Use OpenRouter as the model provider for all LLM calls.

- Fast extraction/filtering model:
  - Metadata cleanup.
  - Chunk labeling.
  - Relevance prefiltering.
  - Obsidian note extraction.
- Strong reasoning model:
  - Expert paper critique.
  - Conflict detection.
  - Comparison against user's worldview.
  - Current-worldview synthesis from Obsidian plus relevant Drive9 paper summaries.
  - Diff report and diff ask generation.
- Default strong model:
  - `deepseek/deepseek-v4-pro` through OpenRouter.
- All task-to-model choices should live in config so they can be adjusted without code changes.

## Traceability

Every important output must preserve provenance:

- arXiv id.
- Paper title and authors.
- PDF URL.
- PDF/text hash.
- Parsed section and chunk ids.
- Source Obsidian note paths used as personal stance context.
- Drive9 paper summaries and diff reports consulted.
- Model provider and model id.
- Prompt template version.
- Analysis run id.
- Agent role that produced the output.
- Agent handoff ids between coordinator, researcher, worldview compiler, and analysis agents.
- Relevance score and triggered filters.
- Diff report id and Drive9 path.
- Diff ask ids and accept/reject/defer status when reviewed.
- Number of explicit diff asks, capped at 10.

## Evaluation Plan

Add deterministic eval fixtures for:

- Irrelevant paper rejection.
- Relevant paper acceptance.
- Paper summary quality against expected extracted claims.
- Detection of conflict with the user's Obsidian worldview.
- Detection of support or extension of an existing Obsidian note.
- Critique of a user stance when stronger paper evidence contradicts it.
- Correct handoff from Coordinator Agent to Researcher Agent, Worldview Compiler Agent, and Analysis Agent.
- Analysis Agent output using both the research packet and current-worldview packet.
- Diff report with 10 or fewer explicit accept/reject/defer asks.
- Creation of a diff report instead of mutating any separate agent-owned worldview.
- Obsidian read-only behavior.
- Drive9 storage of academic-paper summaries and diff reports.
- Idempotent arXiv pulls and duplicate paper handling.

## Minimal Production Infrastructure

- Local SQLite database with migrations.
- Structured JSONL logs.
- Idempotent paper ingestion jobs.
- Retry and backoff for arXiv, PDF fetch, parsing, OpenRouter, mem9, and Drive9 operations.
- Prompt template versioning.
- Eval fixtures and a CLI eval runner.
- Config validation.
- Explicit failure states for partial paper analysis.
- Audit trail for every accepted, rejected, or deferred diff ask.

## Assumptions

- v1 supports arXiv PDFs only.
- Obsidian is read through a local vault path, remains read-only, and is the user's worldview source of truth.
- Diff ask review happens first through the CLI.
- The TypeScript Claude Agent SDK is the base agent runtime.
- OpenRouter is the required LLM provider.
- DeepSeek V4 Pro is the default strong reasoning model.
- Drive9 stores academic-paper summaries, parsed paper references, diff reports, and interaction records, not a separate agent-owned worldview.
- mem9 is used for personal workflow memory, not canonical research evidence or worldview state.
- This document is a saved project plan only; implementation should not begin until explicitly requested.
