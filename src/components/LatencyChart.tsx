import { useMemo, useState } from 'react'
import type { LatencyRecord } from '../lib/latency'
import { niceTicks } from '../lib/ticks'
import { fmtMs } from '../lib/format'

const WIDTH = 720
const HEIGHT = 300
const MARGIN = { top: 16, right: 16, bottom: 34, left: 48 }

const BLUE = '#38bdf8'
const HOVER_BLUE = '#7dd3fc'

interface Point {
  x: number
  y: number
  elapsedSeconds: number
  latencyMs: number
  id: string
}

export function LatencyChart({ records }: { records: LatencyRecord[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const paired = useMemo(
    () =>
      records
        .filter((r): r is LatencyRecord & { latencyMs: number } => r.latencyMs !== null)
        .sort((a, b) => a.request.elapsedSeconds - b.request.elapsedSeconds),
    [records],
  )

  if (paired.length === 0) {
    return <p className="empty-state">No paired requests to plot yet.</p>
  }

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom

  const xMax = Math.max(1e-6, ...paired.map((r) => r.request.elapsedSeconds), 0.001)
  const maxLatency = Math.max(...paired.map((r) => r.latencyMs))
  const yMax = Math.max(maxLatency * 1.15, 1)

  const scaleX = (v: number) => MARGIN.left + (v / xMax) * plotWidth
  const scaleY = (v: number) => MARGIN.top + plotHeight - (v / yMax) * plotHeight

  const points: Point[] = paired.map((r) => ({
    x: scaleX(r.request.elapsedSeconds),
    y: scaleY(r.latencyMs),
    elapsedSeconds: r.request.elapsedSeconds,
    latencyMs: r.latencyMs,
    id: r.id,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('')

  const yTicks = niceTicks(yMax, 5)
  const xTicks = niceTicks(xMax, 6)

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={scaleY(t)} y2={scaleY(t)} stroke="#1c222f" strokeWidth={1} />
            <text x={MARGIN.left - 6} y={scaleY(t)} fill="#5c6780" fontSize={10} fontFamily="'IBM Plex Mono',monospace" textAnchor="end" dominantBaseline="middle">
              {fmtMs(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={scaleX(t)} y={HEIGHT - 8} fill="#5c6780" fontSize={10} fontFamily="'IBM Plex Mono',monospace" textAnchor="middle">
            {t.toFixed(1)}s
          </text>
        ))}

        <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth={1.75} />

        {points.map((p, i) => {
          const isHover = hoverIndex === i
          return (
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={9}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerEnter={() => setHoverIndex(i)}
                onPointerLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={isHover ? 5 : 3}
                fill={isHover ? HOVER_BLUE : BLUE}
                stroke="#05131e"
                strokeWidth={isHover ? 2 : 1}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
        >
          <div>{hovered.id}</div>
          <div className="tt-label">t={hovered.elapsedSeconds.toFixed(3)}s</div>
          <div className="tt-value">{fmtMs(hovered.latencyMs)}</div>
        </div>
      )}
    </div>
  )
}
