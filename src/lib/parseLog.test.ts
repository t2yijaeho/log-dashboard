import { describe, expect, it } from 'vitest'
import { parseLog } from './parseLog'

describe('parseLog', () => {
  it('parses well-formed api_signal lines', () => {
    const raw = [
      '[    0.037000] api_signal: id=api-0092 timestamp=2026-06-08T22:40:00.037 status=REQUEST',
      '[    1.102000] api_signal: id=api-0092 timestamp=2026-06-08T22:40:01.102 status=RESPONSE',
    ].join('\n')

    const { entries, skippedLines } = parseLog(raw)

    expect(skippedLines).toEqual([])
    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({
      elapsedSeconds: 0.037,
      id: 'api-0092',
      timestamp: '2026-06-08T22:40:00.037',
      status: 'REQUEST',
      raw: raw.split('\n')[0],
    })
    expect(entries[1].status).toBe('RESPONSE')
  })

  it('collects unrecognized lines instead of dropping them silently', () => {
    const raw = 'not a real log line\n'
    const { entries, skippedLines } = parseLog(raw)

    expect(entries).toEqual([])
    expect(skippedLines).toEqual([{ lineNo: 1, text: 'not a real log line' }])
  })

  it('skips blank lines without flagging them', () => {
    const raw = '\n   \n'
    const { entries, skippedLines } = parseLog(raw)

    expect(entries).toEqual([])
    expect(skippedLines).toEqual([])
  })
})
