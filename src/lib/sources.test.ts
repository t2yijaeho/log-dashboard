/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { computeLatencyStats, pairLatencies } from './latency'
import { parseLog } from './parseLog'
import { DEFAULT_LOG_SOURCES } from './sources'

const EXPECTED = [
  { name: 'api_signal1.log', parsed: 1000, skipped: 0, paired: 500, unpaired: 0 },
  { name: 'api_signal2.log', parsed: 930, skipped: 70, paired: 430, unpaired: 70 },
  { name: 'api_signal3.log', parsed: 1000, skipped: 0, paired: 500, unpaired: 0 },
]

describe('DEFAULT_LOG_SOURCES', () => {
  it('uses the Vite base path for all three bundled samples', () => {
    expect(DEFAULT_LOG_SOURCES.map((source) => source.label)).toEqual(
      EXPECTED.map((sample) => sample.name),
    )
    DEFAULT_LOG_SOURCES.forEach((source) => {
      expect(source.url).toBe(`${import.meta.env.BASE_URL}samples/${source.label}`)
    })
  })

  it.each(EXPECTED)(
    'parses bundled $name with the documented results',
    ({ name, parsed, skipped, paired, unpaired }) => {
      const raw = readFileSync(resolve('public', 'samples', name), 'utf8')
      const result = parseLog(raw)
      const stats = computeLatencyStats(pairLatencies(result.entries))

      expect(result.entries).toHaveLength(parsed)
      expect(result.skippedLines).toHaveLength(skipped)
      expect(stats?.count).toBe(paired)
      expect(stats?.unpairedCount).toBe(unpaired)
    },
  )
})
