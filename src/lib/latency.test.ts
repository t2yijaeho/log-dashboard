import { describe, expect, it } from 'vitest'
import { parseLog } from './parseLog'
import { computeLatencyStats, pairLatencies } from './latency'

const SAMPLE = [
  '[    0.037000] api_signal: id=api-0092 timestamp=2026-06-08T22:40:00.037 status=REQUEST',
  '[    0.471000] api_signal: id=api-0118 timestamp=2026-06-08T22:40:00.471 status=REQUEST',
  '[    1.102000] api_signal: id=api-0118 timestamp=2026-06-08T22:40:01.102 status=RESPONSE',
  '[    2.000000] api_signal: id=api-0999 timestamp=2026-06-08T22:40:02.000 status=REQUEST',
].join('\n')

describe('pairLatencies', () => {
  it('pairs REQUEST/RESPONSE by id regardless of line order', () => {
    const { entries } = parseLog(SAMPLE)
    const records = pairLatencies(entries)

    expect(records).toHaveLength(3)

    const paired = records.find((r) => r.id === 'api-0118')
    expect(paired?.latencyMs).toBe(631)

    const unpaired = records.find((r) => r.id === 'api-0092')
    expect(unpaired?.response).toBeNull()
    expect(unpaired?.latencyMs).toBeNull()
  })
})

describe('computeLatencyStats', () => {
  it('returns null when no request has a matching response', () => {
    const { entries } = parseLog(
      '[    0.037000] api_signal: id=api-0092 timestamp=2026-06-08T22:40:00.037 status=REQUEST',
    )
    expect(computeLatencyStats(pairLatencies(entries))).toBeNull()
  })

  it('computes count/min/max/avg over paired latencies only', () => {
    const { entries } = parseLog(SAMPLE)
    const stats = computeLatencyStats(pairLatencies(entries))

    expect(stats?.count).toBe(1)
    expect(stats?.unpairedCount).toBe(2)
    expect(stats?.minMs).toBe(631)
    expect(stats?.maxMs).toBe(631)
    expect(stats?.avgMs).toBe(631)
  })

  it('computes percentiles by nearest-rank (ceil(p*n) - 1, clamped)', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({
      id: `r${i}`,
      request: { elapsedSeconds: i, id: `r${i}`, timestamp: '', status: 'REQUEST' as const, raw: '' },
      response: null,
      latencyMs: i + 1, // 1..100
    }))

    const stats = computeLatencyStats(records)

    expect(stats?.p50Ms).toBe(50)
    expect(stats?.p95Ms).toBe(95)
    expect(stats?.p99Ms).toBe(99)
    expect(stats?.maxMs).toBe(100)
  })
})
