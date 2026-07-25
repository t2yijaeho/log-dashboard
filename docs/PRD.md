# PRD — API Latency Viewer

## Summary

A client-only web app for loading an API request/response timestamp log
(download from a URL or upload a local file), viewing the raw entries, and
analyzing request latency — pairing each REQUEST with its matching RESPONSE
and visualizing the resulting latency as summary stats, a time-series chart,
and a distribution histogram.

## Problem

API request/response events are captured to plain-text log files
(`api_signal` format, one event per line). Reading these logs by eye to
understand latency — how long a request took, whether latency is trending up,
where the outliers are — doesn't scale past a handful of lines. There's no
tool to load one of these logs and see latency at a glance.

## Goals

- Load a log file three ways: pick one of three bundled sample logs, fetch a
  custom URL, or upload a local file — with no server-side component.
- Show the raw parsed entries as-is, so the tool is trustworthy (nothing
  hidden between raw data and derived analysis).
- Pair REQUEST/RESPONSE events by `id` and compute per-request latency, then
  visualize it: headline stats (min / avg / p50 / p95 / p99 / max), latency
  over time, and latency distribution.
- Handle imperfect input gracefully: unparseable lines and unpaired
  REQUESTs (no matching RESPONSE) are surfaced, not silently dropped.
- Let a user re-export the currently loaded log (the "download" in the
  original ask) even when it was loaded via upload or a custom URL.

## Non-goals

- No backend, no persistence/database, no auth, no multi-user features.
- No log formats other than `api_signal` (see Data format below).
- No real-time/streaming ingestion — a log is a static file loaded once per
  session.
- No alerting/thresholds (e.g. "page me if p99 > Xms") — this is an
  analysis viewer, not a monitoring system.

## Users

Whoever is debugging or reviewing API performance from a captured log — most
likely the same person who generated the log — using it as a quick
drop-in-and-look tool rather than a shared dashboard.

## Data format

Plain text, one event per line:

```
[    0.037000] api_signal: id=api-0092 timestamp=2026-06-08T22:40:00.037 status=REQUEST
[    1.102000] api_signal: id=api-0118 timestamp=2026-06-08T22:40:01.102 status=RESPONSE
```

- Leading bracketed number — elapsed seconds since log start.
- `id=` — pairs one `REQUEST` line with one `RESPONSE` line; the id prefix is
  not fixed (`api-` vs `sig-` differ between the two sample logs).
- `timestamp=` — ISO 8601 with millisecond precision, no timezone suffix.
- `status=` — `REQUEST` or `RESPONSE`.
- Lines are interleaved across many concurrent in-flight requests — pairing
  requires indexing by `id`, not line order. Some REQUESTs may have no
  matching RESPONSE.

Default/sample data is versioned in `public/samples/` for reproducible static
deployment. Upstream provenance and SHA-256 hashes are recorded in
[`sample-data.md`](sample-data.md).

## Functional requirements

| # | Requirement |
|---|---|
| 1 | User can load a log via: three bundled-source buttons, a pasted HTTP(S) URL fetch, or a local file upload. |
| 2 | User can download/export the currently loaded log as a `.log` file. |
| 3 | Parser surfaces any line that doesn't match the expected format, without dropping it silently. |
| 4 | App pairs REQUEST/RESPONSE by `id` and computes latency (RESPONSE timestamp − REQUEST timestamp) per pair. |
| 5 | REQUESTs with no matching RESPONSE are counted and shown (not treated as errors, not hidden). |
| 6 | Summary view shows count, unpaired count, min, avg, p50, p95, p99, max latency. |
| 7 | Latency-over-time chart plots each paired request's latency against its elapsed time, with hover detail (id, elapsed time, latency). |
| 8 | Latency-distribution histogram buckets paired latencies, with per-bucket hover detail (count, range). |
| 9 | Raw data view lists every parsed entry (elapsed time, id, timestamp, status). |

## Out of scope / future considerations

Not requested and not built; listed here only as things to explicitly decide
on later rather than assume:

- Filtering/searching the raw table or restricting charts to a time range.
- Comparing two loaded logs side by side.
- Exporting computed latency stats (not just the raw log).
- Any chart form beyond the two above (e.g. per-endpoint breakdown), which
  would require the log format to carry an endpoint/route field it currently
  doesn't.

## Current implementation status

Built as a static client application — see [AGENTS.md](../AGENTS.md) for the
command reference and architecture. Stack: Vite + React + TypeScript,
hand-rolled SVG charts (no charting library), and Vitest for parsing/loading/
latency logic. All nine functional requirements are implemented. Remote
requests time out after 15 seconds, and remote/local logs share a 10 MiB
limit.
