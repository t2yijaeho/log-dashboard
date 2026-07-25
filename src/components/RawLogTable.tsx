import type { LogEntry } from '../lib/parseLog'

const CAP = 500
const REQUEST_COLOR = '#38bdf8'
const RESPONSE_COLOR = '#2dd4bf'

export function RawLogTable({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return <p className="empty-state">No entries to show.</p>
  }

  const displayEntries = entries.slice(0, CAP)
  const truncatedNote =
    entries.length > CAP ? `Showing first ${CAP} of ${entries.length} entries` : ''

  return (
    <>
      <div className="raw-card-header">
        <h3>Raw data</h3>
        {truncatedNote && <div className="truncated-note">{truncatedNote}</div>}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>elapsed</th>
              <th>id</th>
              <th>timestamp</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            {displayEntries.map((entry, i) => (
              <tr key={`${entry.id}-${entry.status}-${i}`}>
                <td className="col-elapsed">{entry.elapsedSeconds.toFixed(3)}s</td>
                <td className="col-id">{entry.id}</td>
                <td className="col-timestamp">{entry.timestamp}</td>
                <td style={{ color: entry.status === 'REQUEST' ? REQUEST_COLOR : RESPONSE_COLOR }}>
                  {entry.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
