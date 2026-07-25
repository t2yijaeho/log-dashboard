import { useRef, useState } from 'react'
import { fetchLogText, readLogFile, validateCustomLogUrl } from '../lib/loadLog'
import { DEFAULT_LOG_SOURCES } from '../lib/sources'

interface SourcePickerProps {
  onLoad: (text: string, sourceLabel: string) => void
  onLoadingChange: (loading: boolean) => void
  onError: (message: string | null) => void
  currentText: string | null
  currentLabel: string | null
}

export function SourcePicker({
  onLoad,
  onLoadingChange,
  onError,
  currentText,
  currentLabel,
}: SourcePickerProps) {
  const [customUrl, setCustomUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchUrl(url: string, label: string, custom = false) {
    onError(null)
    onLoadingChange(true)
    try {
      const targetUrl = custom ? validateCustomLogUrl(url) : url
      const text = await fetchLogText(targetUrl)
      onLoad(text, label)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      onError(`Failed to load "${label}": ${message}`)
    } finally {
      onLoadingChange(false)
    }
  }

  async function handleFile(file: File) {
    onError(null)
    onLoadingChange(true)
    try {
      const text = await readLogFile(file)
      onLoad(text, file.name)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      onError(`Failed to read file "${file.name}": ${message}`)
    } finally {
      onLoadingChange(false)
    }
  }

  function handleDownloadCurrent() {
    if (!currentText || !currentLabel) return
    const blob = new Blob([currentText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentLabel.endsWith('.log') ? currentLabel : `${currentLabel}.log`
    document.body.append(a)
    a.click()
    a.remove()
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <div className="toolbar">
      {DEFAULT_LOG_SOURCES.map((source) => (
        <button key={source.url} onClick={() => fetchUrl(source.url, source.label)}>
          {source.label}
        </button>
      ))}

      <div className="toolbar-divider" />

      <input
        type="url"
        placeholder="https://…/custom.log"
        value={customUrl}
        onChange={(e) => setCustomUrl(e.target.value)}
      />
      <button
        className="primary"
        disabled={!customUrl.trim()}
        onClick={() =>
          fetchUrl(customUrl, customUrl.split('/').pop() || customUrl, true)
        }
      >
        Fetch
      </button>

      <div className="toolbar-divider" />

      <button onClick={() => fileInputRef.current?.click()}>Upload file</button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".log,.txt"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      <button className="push-right" disabled={!currentText} onClick={handleDownloadCurrent}>
        Download current log
      </button>
    </div>
  )
}
