export const MAX_LOG_BYTES = 10 * 1024 * 1024
export const FETCH_TIMEOUT_MS = 15_000

const MAX_LOG_MIB = MAX_LOG_BYTES / (1024 * 1024)

function sizeLimitError() {
  return new Error(`Log exceeds the ${MAX_LOG_MIB} MiB limit.`)
}

export function validateCustomLogUrl(input: string): string {
  let url: URL

  try {
    url = new URL(input.trim())
  } catch {
    throw new Error('Enter a valid absolute HTTP(S) URL.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only HTTP(S) log URLs are supported.')
  }

  return url.href
}

async function readResponseText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_LOG_BYTES) {
    throw sizeLimitError()
  }

  if (!response.body) {
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > MAX_LOG_BYTES) throw sizeLimitError()
    return new TextDecoder().decode(bytes)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let totalBytes = 0
  let text = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalBytes += value.byteLength
      if (totalBytes > MAX_LOG_BYTES) {
        await reader.cancel()
        throw sizeLimitError()
      }

      text += decoder.decode(value, { stream: true })
    }
  } finally {
    reader.releaseLock()
  }

  return text + decoder.decode()
}

export async function fetchLogText(url: string): Promise<string> {
  const controller = new AbortController()
  let timedOut = false
  const timeout = globalThis.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await readResponseText(response)
  } catch (error) {
    if (timedOut) {
      throw new Error(
        `Request timed out after ${FETCH_TIMEOUT_MS / 1000} seconds.`,
        { cause: error },
      )
    }
    throw error
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

export async function readLogFile(file: File): Promise<string> {
  if (file.size > MAX_LOG_BYTES) throw sizeLimitError()
  return file.text()
}
