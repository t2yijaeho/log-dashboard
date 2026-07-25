import type { LogEntry } from './parseLog'

export interface LatencyRecord {
  id: string
  request: LogEntry
  /** null when the log has a REQUEST with no matching RESPONSE (in-flight/dropped). */
  response: LogEntry | null
  latencyMs: number | null
}

export interface LatencyStats {
  count: number
  unpairedCount: number
  minMs: number
  maxMs: number
  avgMs: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
}

/**
 * Pairs REQUEST/RESPONSE entries by id. Entries are not adjacent in the log
 * (many requests are in flight at once), so pairing is done by an id index
 * rather than by line order.
 */
export function pairLatencies(entries: LogEntry[]): LatencyRecord[] {
  const requestsById = new Map<string, LogEntry>()
  const responsesById = new Map<string, LogEntry>()

  for (const entry of entries) {
    const bucket = entry.status === 'REQUEST' ? requestsById : responsesById
    // Last one wins if an id repeats; real logs shouldn't repeat an id per status.
    bucket.set(entry.id, entry)
  }

  const records: LatencyRecord[] = []
  for (const [id, request] of requestsById) {
    const response = responsesById.get(id) ?? null
    const latencyMs = response
      ? Date.parse(response.timestamp) - Date.parse(request.timestamp)
      : null
    records.push({ id, request, response, latencyMs })
  }

  return records.sort(
    (a, b) => a.request.elapsedSeconds - b.request.elapsedSeconds,
  )
}

export function computeLatencyStats(records: LatencyRecord[]): LatencyStats | null {
  const latencies = records
    .map((r) => r.latencyMs)
    .filter((ms): ms is number => ms !== null)
    .sort((a, b) => a - b)

  if (latencies.length === 0) return null

  const sum = latencies.reduce((total, ms) => total + ms, 0)
  const percentile = (p: number) => {
    const index = Math.min(
      latencies.length - 1,
      Math.max(0, Math.ceil((p / 100) * latencies.length) - 1),
    )
    return latencies[index]
  }

  return {
    count: latencies.length,
    unpairedCount: records.length - latencies.length,
    minMs: latencies[0],
    maxMs: latencies[latencies.length - 1],
    avgMs: sum / latencies.length,
    p50Ms: percentile(50),
    p95Ms: percentile(95),
    p99Ms: percentile(99),
  }
}
