import { useMemo, useState } from 'react'
import { parseLog } from './lib/parseLog'
import { pairLatencies, computeLatencyStats } from './lib/latency'
import { SourcePicker } from './components/SourcePicker'
import { SkippedLinesPanel } from './components/SkippedLinesPanel'
import { RawLogTable } from './components/RawLogTable'
import { StatTiles } from './components/StatTiles'
import { LatencyChart } from './components/LatencyChart'
import { LatencyHistogram } from './components/LatencyHistogram'

export function App() {
  const [rawText, setRawText] = useState<string | null>(null)
  const [sourceLabel, setSourceLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { entries, skippedLines } = useMemo(
    () => (rawText !== null ? parseLog(rawText) : { entries: [], skippedLines: [] }),
    [rawText],
  )
  const records = useMemo(() => pairLatencies(entries), [entries])
  const stats = useMemo(() => computeLatencyStats(records), [records])

  const hasData = entries.length > 0
  const showEmptyState = !hasData && !loading && !error

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="app-header">
        <div className="app-brand">
          <div className="app-logo">&gt;_</div>
          <div>
            <div className="app-title">LOG ANALYZER</div>
            <div className="app-subtitle">api_signal request/response latency viewer</div>
          </div>
        </div>
        {hasData && (
          <div className="app-status">
            <div>{sourceLabel}</div>
            <div>
              {entries.length} entries &middot; {skippedLines.length} skipped
            </div>
          </div>
        )}
      </div>

      <SourcePicker
        currentText={rawText}
        currentLabel={sourceLabel}
        onLoadingChange={setLoading}
        onError={setError}
        onLoad={(text, label) => {
          setRawText(text)
          setSourceLabel(label)
        }}
      />

      {loading && (
        <div className="loading-row">
          <div className="spinner" />
          Fetching log…
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <SkippedLinesPanel skippedLines={skippedLines} />

      {hasData && (
        <>
          {stats && <StatTiles stats={stats} />}

          <div className="chart-row">
            <div className="chart-card">
              <h3>Latency over time</h3>
              <LatencyChart records={records} />
            </div>
            <div className="chart-card histogram">
              <h3>Latency distribution</h3>
              <LatencyHistogram records={records} />
            </div>
          </div>

          <div className="raw-card">
            <RawLogTable entries={entries} />
          </div>
        </>
      )}

      {showEmptyState && <div className="empty-state">Load a log to see latency analysis.</div>}
    </div>
  )
}
