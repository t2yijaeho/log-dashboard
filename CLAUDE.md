# CLAUDE.md

Read and follow `AGENTS.md` at the repository root before doing any work. It
is the canonical source for commands, architecture, security constraints,
testing, and release rules.

Claude-specific project agents live in `.claude/agents/`. Run the native
`.claude/workflows/dev-pipeline.js` workflow for non-trivial delivery work;
it preserves the same Plan → Implement → Test → Review → Release lifecycle
as the Codex `$dev-pipeline` skill.
