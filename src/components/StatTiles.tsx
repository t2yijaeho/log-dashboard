import type { LatencyStats } from '../lib/latency'
import { fmtMs } from '../lib/format'

const ACCENT = '#38bdf8'
const RED = '#f87171'
const AMBER = '#f0b849'
const DEFAULT = 'inherit'

export function StatTiles({ stats }: { stats: LatencyStats }) {
  const tiles: Array<[string, string, string]> = [
    ['Paired', String(stats.count), DEFAULT],
    ['Unpaired', String(stats.unpairedCount), stats.unpairedCount > 0 ? AMBER : DEFAULT],
    ['Min', fmtMs(stats.minMs), DEFAULT],
    ['Avg', fmtMs(stats.avgMs), DEFAULT],
    ['P50', fmtMs(stats.p50Ms), DEFAULT],
    ['P95', fmtMs(stats.p95Ms), ACCENT],
    ['P99', fmtMs(stats.p99Ms), ACCENT],
    ['Max', fmtMs(stats.maxMs), RED],
  ]

  return (
    <div className="stat-tiles">
      {tiles.map(([label, value, color]) => (
        <div className="stat-tile" key={label}>
          <div className="label">{label}</div>
          <div className="value" style={{ color }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}
