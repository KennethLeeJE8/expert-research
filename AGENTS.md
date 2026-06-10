# Development Instructions

## Claude Agent SDK Reference

This project uses the TypeScript Claude Agent SDK as the base runtime for agent orchestration, tool calling, CLI integration, and API integration.

During development, consult the current SDK reference before designing or changing any SDK-dependent behavior:

- Primary reference: https://github.com/anthropics/claude-agent-sdk-typescript
- Official docs linked from that repository: https://docs.claude.com/en/api/agent-sdk/overview

Treat the current SDK docs as the source of truth over memory, older examples, or inferred APIs. Prefer SDK-native primitives and patterns for agent sessions, tools, permissions, options, streaming, and lifecycle handling before adding project-specific orchestration.

When implementing or reviewing code that depends on the SDK, explicitly account for the relevant SDK behavior in the final notes or review findings.
