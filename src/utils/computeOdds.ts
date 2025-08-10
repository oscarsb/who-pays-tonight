// src/utils/computeOdds.ts
export type OddsMode = "mild" | "normal" | "aggressive"

export function computeOdds(
  players: string[],
  totals: Record<string, number>,
  amount: number,
  mode: OddsMode
) {
  if (!players.length) return { percentages: [] as number[], angles: [] as number[] }

  const afterTotals = players.map(name => (totals[name] || 0) + (amount || 0))

  const weights = afterTotals.map(v => {
    const x = v + 1 // avoid division by zero
    if (mode === "mild") return 1 / Math.sqrt(x)
    if (mode === "aggressive") return 1 / Math.pow(x, 2)
    return 1 / x
  })

  const sum = weights.reduce((a, b) => a + b, 0) || 1
  const percentages = weights.map(w => w / sum)
  const angles = percentages.map(p => p * 360)

  return { percentages, angles }
}