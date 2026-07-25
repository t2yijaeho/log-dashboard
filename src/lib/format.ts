export function fmtMs(ms: number | null): string {
  if (ms === null || Number.isNaN(ms)) return '—'
  if (ms < 10) return `${ms.toFixed(2)} ms`
  if (ms < 100) return `${ms.toFixed(1)} ms`
  return `${Math.round(ms)} ms`
}
