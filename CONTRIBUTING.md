# Contributing

## Setup

Use Node.js 20.19 or newer and install the locked graph:

```bash
npm ci
```

Start the development server with `npm run dev`.

## Changes

- Keep parsing and analysis logic in `src/lib/` with colocated Vitest tests.
- Keep React presentation in `src/components/`.
- Preserve the pairing, percentile, formatting, and chart invariants in
  `AGENTS.md`.
- Do not add a backend, telemetry, or production dependency without an
  approved design.

## Pull requests

Run the complete local gate before opening a pull request:

```bash
npm run lint
npm test
npm run build
npm run build:pages
npm audit --audit-level=high
```

Describe user-visible behavior, tests performed, and any security or privacy
impact. Keep commits focused and never include real credentials or sensitive
production logs.
