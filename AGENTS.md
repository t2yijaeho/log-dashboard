# AGENTS.md

Repository guidance for the API Latency Viewer.

## Commands

```text
npm ci                 install the locked dependency graph
npm run dev            start Vite for local development
npm run lint           run ESLint
npm test               run the Vitest suite once
npm run build          type-check and build for a root path
npm run build:pages    type-check and build for /log-dashboard/
npm run preview        preview the most recent build
```

Run one test with `npx vitest run src/lib/latency.test.ts` or match a test
name with `npx vitest run -t "pairs REQUEST"`.

## Product boundaries

This is a client-only React application. It loads an `api_signal` log from
one of three bundled samples, an HTTP(S) URL, or a local file. It parses raw
entries, pairs `REQUEST` and `RESPONSE` events by `id`, and renders latency
statistics and two hand-built SVG charts. Do not add a backend, telemetry,
authentication, persistence, or a charting dependency without an approved
design.

Bundled data lives in `public/samples/`; provenance and integrity hashes are
recorded in `docs/sample-data.md`.

## Architecture invariants

- Keep framework-free parsing, loading, formatting, and analysis logic in
  `src/lib/`, with colocated Vitest coverage.
- Keep React presentation in `src/components/`; `App.tsx` owns loading and
  error state.
- Pair events by `id`, never by adjacency. Preserve unpaired requests with
  `latencyMs: null`.
- Preserve nearest-rank percentiles:
  `clamp(ceil((p / 100) * n) - 1, 0, n - 1)`.
- Use `fmtMs()` everywhere latency is displayed and `niceTicks()` for chart
  axes.
- Keep the fixed dark theme in `src/index.css` and the charts as hand-built
  SVG.
- Surface malformed lines rather than silently discarding them.
- Keep log loading client-side. Custom URLs must be absolute HTTP(S), omit
  credentials and referrer data, time out after 15 seconds, and enforce the
  10 MiB limit shared with local uploads.

## Delivery workflow

Use `$dev-pipeline` for non-trivial changes and releases. The pipeline is:

1. Plan
2. Implement
3. Test
4. Review
5. Release

Implementation, Test, and Review may loop up to three times. Plan and Review
are read-only. Test may create build/cache output but must not edit tracked
source. Release may update release documentation; it may commit, push,
publish, or change GitHub settings only when the user explicitly authorizes
those actions.

Codex agents live in `.codex/agents/`. Claude agents and its native workflow
live in `.claude/`. Keep both pipelines behaviorally aligned.

## Release gate

Before publishing, run `npm ci`, lint, tests, both builds, and both full and
production-only npm audits. Inspect the complete staged file list for
credentials, local settings, prohibited third-party content, and unexpected
binaries. Never force-push, bypass hooks, or publish a failing build.
