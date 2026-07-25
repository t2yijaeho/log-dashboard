/** Rounds to clean step sizes (1/2/5 x 10^n) so axis ticks read as whole numbers. */
export function niceTicks(maxValue: number, targetCount = 4): number[] {
  if (maxValue <= 0) return [0]

  const rawStep = maxValue / targetCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const residual = rawStep / magnitude

  let niceResidual: number
  if (residual > 5) niceResidual = 10
  else if (residual > 2) niceResidual = 5
  else if (residual > 1) niceResidual = 2
  else niceResidual = 1

  const step = niceResidual * magnitude
  const ticks: number[] = []
  for (let v = 0; v <= maxValue + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1000) / 1000)
  }
  return ticks
}
