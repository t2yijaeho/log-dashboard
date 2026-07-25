import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FETCH_TIMEOUT_MS,
  MAX_LOG_BYTES,
  fetchLogText,
  readLogFile,
  validateCustomLogUrl,
} from './loadLog'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('validateCustomLogUrl', () => {
  it('accepts and normalizes absolute HTTP(S) URLs', () => {
    expect(validateCustomLogUrl(' https://example.com/custom.log ')).toBe(
      'https://example.com/custom.log',
    )
    expect(validateCustomLogUrl('http://localhost:8080/test.log')).toBe(
      'http://localhost:8080/test.log',
    )
  })

  it('rejects relative and non-HTTP(S) URLs', () => {
    expect(() => validateCustomLogUrl('/sample.log')).toThrow(
      'valid absolute HTTP(S) URL',
    )
    expect(() => validateCustomLogUrl('file:///tmp/sample.log')).toThrow(
      'Only HTTP(S)',
    )
  })
})

describe('fetchLogText', () => {
  it('omits credentials and referrer data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('sample log'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchLogText('/samples/api_signal1.log')).resolves.toBe('sample log')
    expect(fetchMock).toHaveBeenCalledWith(
      '/samples/api_signal1.log',
      expect.objectContaining({
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('rejects a declared oversized response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('too large', {
          headers: { 'content-length': String(MAX_LOG_BYTES + 1) },
        }),
      ),
    )

    await expect(fetchLogText('https://example.com/large.log')).rejects.toThrow(
      '10 MiB limit',
    )
  })

  it('rejects a streamed response that crosses the size limit', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_LOG_BYTES))
        controller.enqueue(new Uint8Array(1))
        controller.close()
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)))

    await expect(fetchLogText('https://example.com/large.log')).rejects.toThrow(
      '10 MiB limit',
    )
  })

  it('aborts a request after the timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      }),
    )

    const assertion = expect(
      fetchLogText('https://example.com/slow.log'),
    ).rejects.toThrow('timed out after 15 seconds')
    await vi.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS)
    await assertion
  })
})

describe('readLogFile', () => {
  it('reads a local text file within the limit', async () => {
    const file = new File(['sample log'], 'sample.log', { type: 'text/plain' })
    await expect(readLogFile(file)).resolves.toBe('sample log')
  })

  it('rejects an oversized local file before reading it', async () => {
    const file = new File([new Uint8Array(MAX_LOG_BYTES + 1)], 'large.log')
    await expect(readLogFile(file)).rejects.toThrow('10 MiB limit')
  })
})
