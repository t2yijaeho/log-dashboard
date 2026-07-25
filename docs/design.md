# Log Analyzer Dashboard — Design Reference

Status: **implemented** (this spec documents the shipped design, written
after the fact to serve as the reference for future changes).

## Summary

A single-page, client-only dashboard for loading an `api_signal`
request/response log, viewing its raw entries, and analyzing latency between
paired REQUEST/RESPONSE events. The visual design is a fixed dark
"terminal" theme. `docs/PRD.md` is this document's product-level sibling.

## Goals

- Preserve the approved colors, fonts, chart interaction model, and number
  formatting.
- Keep the parsing/latency logic framework-free and unit-tested, independent
  of how it's displayed (see Architecture).
- Handle imperfect input visibly: unparseable lines, unpaired requests, fetch
  failures, and large logs (500-row display cap) are all surfaced to the
  user rather than silently dropped or left to overflow the UI.

## Non-goals

Unchanged from `docs/PRD.md`: no backend, no persistence, no multi-log
comparison, no filtering/time-range controls, no light-mode variant. This
spec covers the dashboard's internal design, not new product scope.

## Architecture

```
User action (toolbar / upload)
        │
        ▼
SourcePicker  ──onLoad(text,label)──▶  App (rawText, sourceLabel state)
        │
        │ onLoadingChange / onError
        ▼
App (loading, error state)
        │
        ▼  useMemo
parseLog(rawText) ──▶ { entries, skippedLines }
        │
        ▼  useMemo
pairLatencies(entries) ──▶ LatencyRecord[]
        │
        ▼  useMemo
computeLatencyStats(records) ──▶ LatencyStats | null
        │
        ▼
StatTiles / LatencyChart / LatencyHistogram / RawLogTable / SkippedLinesPanel
```

State lives entirely in `App.tsx` (`rawText`, `sourceLabel`, `loading`,
`error`); `parseLog` → `pairLatencies` → `computeLatencyStats` are pure
functions re-run via `useMemo` whenever `rawText` changes. Nothing is cached
across log loads — switching sources fully replaces all derived state.

`hasData = entries.length > 0`, checked independently of `loading`/`error`,
so a log that parses to zero entries (e.g. an empty file) falls through to
the empty state rather than rendering empty charts.

## Components

Each component has one job and no hidden coupling to its siblings — props
in, render out.

| Component | Job | Depends on |
|---|---|---|
| `SourcePicker` | Load a log via bundled button / URL fetch / file upload; re-download the current one | `lib/sources.ts`, `lib/loadLog.ts` |
| `SkippedLinesPanel` | Collapsible list of lines that failed to parse, by original line number | `lib/parseLog.ts` (`SkippedLine`) |
| `StatTiles` | Render the 8 summary stats with the spec's color mapping | `lib/latency.ts` (`LatencyStats`), `lib/format.ts` (`fmtMs`) |
| `LatencyChart` | Discrete-point latency-vs-elapsed-time chart with per-point hover | `lib/ticks.ts`, `lib/format.ts` |
| `LatencyHistogram` | Latency distribution histogram, bins spanning `[min, max]` of the data | `lib/ticks.ts`, `lib/format.ts` |
| `RawLogTable` | First 500 parsed entries as a table, with a truncation note if more exist | `lib/parseLog.ts` (`LogEntry`) |
| `App` | Owns load state, wires the pipeline, decides which section renders | all of the above |

`SourcePicker` deliberately holds **no** loading/error state of its own — it
reports both up via `onLoadingChange`/`onError` callbacks so `App` can render
the spinner and error banner *outside* the toolbar card, matching the
original design's layout (loading/error live between the toolbar and the
rest of the page, not nested inside the toolbar box).

## Data model & pure logic (`src/lib/`)

- **`parseLog(raw: string): { entries: LogEntry[]; skippedLines: SkippedLine[] }`**
  Regex-matches each non-blank line against the `api_signal` format. A line
  that doesn't match becomes `{ lineNo, text }` (1-indexed against the
  original file, blank lines don't consume a flagged slot but do count
  toward line numbering) rather than being dropped.

- **`pairLatencies(entries): LatencyRecord[]`**
  Indexes REQUESTs and RESPONSEs into two `Map<id, LogEntry>`s (last write
  wins per id/status), then joins them by id — not by line adjacency, since
  many requests are in flight at once. A REQUEST with no matching RESPONSE
  produces `{ latencyMs: null, response: null }` instead of being excluded.
  Result is sorted by the REQUEST's `elapsedSeconds`.

- **`fetchLogText(url: string): Promise<string>` /
  `readLogFile(file: File): Promise<string>`**
  Keep all data processing in the browser. Remote requests omit credentials
  and referrer data, time out after 15 seconds, and stream through the same
  10 MiB limit enforced before local files are read. Custom URLs are limited
  to absolute HTTP(S) addresses.

- **`computeLatencyStats(records): LatencyStats | null`**
  `null` when no record is paired. Otherwise: `count`, `unpairedCount`,
  `minMs`, `maxMs`, `avgMs`, and `p50Ms`/`p95Ms`/`p99Ms` via **nearest-rank**:
  `index = clamp(ceil((p/100) * n) - 1, 0, n-1)` against the sorted latency
  array. This is a deliberate product rule —
  it differs from a floor-based percentile and the two will disagree on
  exact values for the same input, so don't "simplify" this back to floor
  division. Locked in by `latency.test.ts`.

- **`fmtMs(ms: number | null): string`**
  The one formatter used everywhere a latency value is shown. Always
  `"N ms"` — **never** converts to seconds, even for multi-second latencies.
  Precision tiers: `< 10` → 2 decimals, `< 100` → 1 decimal, else rounded to
  an integer. Changing this changes numbers across the whole UI (stat
  tiles, both charts, tooltips) — there's no per-component override.

- **`niceTicks(maxValue, targetCount): number[]`**
  1/2/5×10^n axis-tick rounding, always called with an implicit min of 0
  (neither chart currently needs a non-zero-floored tick axis).

## Chart specifications

Both charts are hand-rolled SVG (no charting library), `viewBox="0 0 720
300"`, margins `{ top: 16, right: 16, bottom: 34, left: 48 }`.

**Latency over time (`LatencyChart`)** — a *discrete-point* chart, not a
continuous line-with-crosshair:
- X axis: REQUEST `elapsedSeconds` (label `"N.Ns"`). Y axis: `latencyMs`
  (label via `fmtMs`), scaled to `max(maxLatency * 1.15, 1)` so the topmost
  point isn't flush against the plot edge.
- A single `M...L...` path connects points in x-sorted order (stroke
  `#0ea5e9`, width 1.75) — no area fill under the line.
- Each point is two overlaid circles: a `r=9` transparent hit-circle
  (pointer target) and a visible `r=3` dot (`#38bdf8`) that grows to `r=5`
  and recolors to `#7dd3fc` on hover, with a `#05131e` stroke that thickens
  from 1→2 on hover. Hover state is `hoverIndex: number | null` in component
  state — one point hovered at a time, tooltip shows id / elapsed / latency.

**Latency distribution (`LatencyHistogram`)** — bins span `[min, max]` of
the *paired* latencies, **not** `[0, max]`. This means bin edges are
relative to the actual observed range, so a log where every latency sits
between 2s and 3s gets 16 bins that subdivide that 1-second window, not 16
bins subdividing 0–3s mostly empty. `BIN_COUNT = 16`, bars are teal
(`#2dd4bf`), hover recolors to the same `#7dd3fc` used by the line chart's
hover state (a deliberate shared accent, not an inconsistency), rounded-top
only (`roundedTopBarPath`), 2px gap between bars. X-axis ticks are 5 evenly
spaced points across `[min, max]` (not `niceTicks` — quartile fractions of
the observed range, labeled via `fmtMs`); Y-axis ticks are `niceTicks` over
the max bin count.

Both charts render `<p className="empty-state">No paired requests to plot
yet.</p>` when there are zero paired records (e.g. a log of REQUESTs with no
RESPONSEs yet) — this is distinct from the app-level empty state, which
covers "no log loaded at all."

## Visual design system

Fixed dark theme, defined once as CSS custom properties in `src/index.css`
(no `prefers-color-scheme` branching — this app does not have a light mode):

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#0a0d13` | page background, under the grid |
| `--grid-line` | `rgba(255,255,255,0.035)` | 28px background grid |
| `--surface` / `--surface-alt` | `#0e131c` / `#101623` | cards / toolbar buttons & logo box |
| `--border` / `--border-strong` | `#1c222f` / `#253046` | card borders / button & input borders |
| `--text-primary` … `--text-empty` | `#eef1f6` → `#4b5570` | a 6-step text-dimness ramp, brightest to faintest |
| `--accent` / `--accent-bright` / `--accent-hover` | `#0ea5e9` / `#38bdf8` / `#7dd3fc` | line stroke+fetch button / points+P95+P99+logo / hover state |
| `--teal` | `#2dd4bf` | histogram bars, RESPONSE status text |
| `--amber` family | `#f0b849` / `#c9a862` / `#171308` bg / `#3a2f10` border | skipped-lines panel |
| `--red` | `#f87171` | Max stat tile |

Fonts: `'Space Grotesk'` (display/UI text) and `'IBM Plex Mono'`
(numbers, code-like text — stat values, table cells, axis labels, toolbar
buttons), loaded via Google Fonts `<link>` tags in `index.html`.

## Error handling

- **Fetch failure** (default/custom URL): caught in `SourcePicker`, surfaces
  as `Failed to load "<label>": <message>` in the app-level error banner.
  Loading state always clears in a `finally`, so a failed fetch can't leave
  the spinner stuck.
- **Unsafe or oversized input**: custom URLs must be absolute HTTP(S);
  remote requests time out after 15 seconds; remote and local files over
  10 MiB are rejected before parsing.
- **File read failure**: `FileReader.onerror` surfaces `Failed to read file
  "<name>"` through the same `onError` callback.
- **Malformed lines**: never an error — collected into `skippedLines` and
  shown in the collapsible `SkippedLinesPanel`, with the count also
  mirrored in the header (`"{entries} entries · {skipped} skipped"`).
- **Unpaired REQUESTs**: never an error — counted in `StatTiles`
  (`Unpaired`, amber if `> 0`) and included in the raw table like any other
  entry; simply excluded from the latency charts/stats since they have no
  `latencyMs`.
- **Large logs**: the raw table caps display at 500 rows with a `"Showing
  first 500 of N entries"` note — the full parsed set still feeds the stats
  and charts, only the table view is capped.

## Testing

The `src/lib/*.test.ts` suite covers parsing, loading limits and privacy,
bundled sample outcomes, non-adjacent pairing, unpaired handling, and the
exact nearest-rank percentile formula. Run with `npm test` (all) or
`npx vitest run src/lib/latency.test.ts` (single file). Components are not
unit-tested; verify all bundled logs, hover tooltips, malformed-line uploads,
and empty/error states in a browser after interaction changes.

## Open questions / deliberate non-decisions

- The histogram's hover color intentionally reuses the line chart's
  `#7dd3fc` accent rather than a teal-family shade.
- No test coverage for the React components/hover interactions — acceptable
  given the small surface area, but flag if this grows.
