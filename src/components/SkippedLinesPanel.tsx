import { useState } from 'react'
import type { SkippedLine } from '../lib/parseLog'

export function SkippedLinesPanel({ skippedLines }: { skippedLines: SkippedLine[] }) {
  const [expanded, setExpanded] = useState(false)

  if (skippedLines.length === 0) return null

  return (
    <div className="skipped-panel">
      <button className="skipped-summary" onClick={() => setExpanded((v) => !v)}>
        <span>
          ⚠ {skippedLines.length} line(s) did not match the api_signal format
        </span>
        <span>{expanded ? 'hide ▲' : 'show ▼'}</span>
      </button>
      {expanded && (
        <div className="skipped-lines">
          {skippedLines.map((s) => (
            <div className="skipped-line" key={s.lineNo}>
              L{s.lineNo}: {s.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
