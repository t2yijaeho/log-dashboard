export type SignalStatus = 'REQUEST' | 'RESPONSE'

export interface LogEntry {
  /** Elapsed seconds since log start, from the leading `[   0.037000]` field. */
  elapsedSeconds: number
  id: string
  /** ISO-8601-ish timestamp as it appears in the log, e.g. 2026-06-08T22:40:00.037 */
  timestamp: string
  status: SignalStatus
  /** Original source line, kept for the raw data view. */
  raw: string
}

export interface SkippedLine {
  lineNo: number
  text: string
}

export interface ParseResult {
  entries: LogEntry[]
  /** Lines that didn't match the expected format (surfaced so bad input isn't silently dropped). */
  skippedLines: SkippedLine[]
}

const LINE_PATTERN =
  /^\s*\[\s*([\d.]+)\]\s+api_signal:\s+id=(\S+)\s+timestamp=(\S+)\s+status=(REQUEST|RESPONSE)\s*$/

export function parseLog(raw: string): ParseResult {
  const entries: LogEntry[] = []
  const skippedLines: SkippedLine[] = []

  raw.split('\n').forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed === '') return

    const match = LINE_PATTERN.exec(trimmed)
    if (!match) {
      skippedLines.push({ lineNo: i + 1, text: trimmed })
      return
    }

    const [, elapsed, id, timestamp, status] = match
    entries.push({
      elapsedSeconds: Number(elapsed),
      id,
      timestamp,
      status: status as SignalStatus,
      raw: trimmed,
    })
  })

  return { entries, skippedLines }
}
