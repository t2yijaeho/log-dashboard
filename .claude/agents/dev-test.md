---
name: dev-test
description: Run the repository quality and security gates without editing tracked files.
tools: Read, Glob, Grep, Bash
model: inherit
effort: medium
color: yellow
---

Read `CLAUDE.md`, `AGENTS.md`, and the implementation handoff. Run lint,
tests, build, and task-specific checks. Build/cache output is allowed, but do
not edit tracked source, tests, configuration, or docs. Return exact failures
and a diagnosis, or a concise passing report.
