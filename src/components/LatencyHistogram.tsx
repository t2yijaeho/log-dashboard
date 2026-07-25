import { useMemo, useState } from 'react'
import type { LatencyRecord } from '../lib/latency'
import { niceTicks } from '../lib/ticks'
import { fmtMs } from '../lib/format'

const WIDTH = 720
const HEIGHT = 300
const MARGIN = { top: 16, right: 16, bottom: 34, left: 48 }
const BAR_GAP = 2
const BAR_RADIUS = 4
const BIN_COUNT = 16

const TEAL = '#2dd4bf'
const HOVER_BLUE = '#7dd3fc'

interface Bin {
  from: number
  to: number
  count: number
}

function roundedTopBarPath(x: number, y: number, width: number, baselineY: number, radius: number) {
  const height = baselineY - y
  const r = Math.min(radius, width / 2, Math.max(height, 0))
  if (height <= 0) return ''
  return `M${x},${baselineY} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${baselineY} Z`
}

export function LatencyHistogram({ records }: { records: LatencyRecord[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const latencies = useMemo(
    () => records.map((r) => r.latencyMs).filter((ms): ms is number => ms !== null),
    [records],
  )

  const { bins, min, range } = useMemo(() => {
    if (latencies.length === 0) return { bins: [] as Bin[], min: 0, range: 0.001 }
    const min = Math.min(...latencies)
    const max = Math.max(...latencies)
    const range = Math.max(max - min, 0.001)
    const binWidth = range / BIN_COUNT
    const buckets: Bin[] = Array.from({ length: BIN_COUNT }, (_, i) => ({
      from: min + i * binWidth,
      to: min + (i + 1) * binWidth,
      count: 0,
    }))
    for (const ms of latencies) {
      const idx = Math.min(BIN_COUNT - 1, Math.max(0, Math.floor((ms - min) / binWidth)))
      buckets[idx].count += 1
    }
    return { bins: buckets, min, range }
  }, [latencies])

  if (bins.length === 0) {
    return <p className="empty-state">No paired requests to plot yet.</p>
  }

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const maxCount = Math.max(1, ...bins.map((b) => b.count))
  const baselineY = MARGIN.top + plotHeight

  const slotWidth = plotWidth / bins.length
  const barWidth = Math.max(1, slotWidth - BAR_GAP)
  const scaleY = (count: number) => (count / maxCount) * plotHeight

  const yTicks = niceTicks(maxCount, 4)
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    x: MARGIN.left + f * plotWidth,
    label: fmtMs(min + f * range),
  }))
  const hovered = hoverIndex !== null ? bins[hoverIndex] : null

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={baselineY - scaleY(t)}
              y2={baselineY - scaleY(t)}
              stroke="#1c222f"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 6}
              y={baselineY - scaleY(t)}
              fill="#5c6780"
              fontSize={10}
              fontFamily="'IBM Plex Mono',monospace"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {Math.round(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text key={i} x={t.x} y={HEIGHT - 8} fill="#5c6780" fontSize={10} fontFamily="'IBM Plex Mono',monospace" textAnchor="middle">
            {t.label}
          </text>
        ))}

        {bins.map((bin, i) => {
          const x = MARGIN.left + i * slotWidth + (slotWidth - barWidth) / 2
          const barHeight = scaleY(bin.count)
          const y = baselineY - barHeight
          const isHovered = hoverIndex === i
          return (
            <g key={i}>
              <path
                d={roundedTopBarPath(x, y, barWidth, baselineY, BAR_RADIUS)}
                fill={isHovered ? HOVER_BLUE : TEAL}
              />
              <rect
                x={MARGIN.left + i * slotWidth}
                y={MARGIN.top}
                width={slotWidth}
                height={plotHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerEnter={() => setHoverIndex(i)}
                onPointerLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
              />
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((MARGIN.left + (hoverIndex! + 0.5) * slotWidth) / WIDTH) * 100}%`,
            top: `${((baselineY - scaleY(hovered.count)) / HEIGHT) * 100}%`,
          }}
        >
          <div className="tt-label">
            {fmtMs(hovered.from)} – {fmtMs(hovered.to)}
          </div>
          <div className="tt-value">{hovered.count} request(s)</div>
        </div>
      )}
    </div>
  )
}
