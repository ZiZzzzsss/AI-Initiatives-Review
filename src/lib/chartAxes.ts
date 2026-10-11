import type { Initiative, ScenarioKey } from '../types'
import { isComplete, scenarioKeys } from './assessment'

export type AxisMode = 'fit' | 'full'
export type AxisBounds = {
  x: [number, number]
  y: [number, number]
  xTicks: number[]
  yTicks: number[]
  fittedCount: number
}

const niceStep = (target: number) => {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(target, 0.01)))
  const scaled = target / magnitude
  return (scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10) * magnitude
}

export function chartAxisBounds(
  items: Initiative[], scenario: ScenarioKey, mode: AxisMode,
  lockAcrossScenarios: boolean, fullY: [number, number],
): AxisBounds {
  const keys = mode === 'fit' && lockAcrossScenarios ? scenarioKeys : [scenario]
  const values = items.flatMap(item => keys.filter(key => isComplete(item, key)).map(key => ({
    impact: item.scenarios[key].impact as number,
    months: item.scenarios[key].months as number,
  })))
  if (mode === 'full' || values.length === 0) {
    const [min, max] = fullY
    const step = niceStep((max - min) / 6)
    const yTicks = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step)
    return { x: [1, 5], y: [min, max], xTicks: [1, 2, 3, 4, 5], yTicks, fittedCount: values.length }
  }
  const impacts = values.map(value => value.impact)
  const months = values.map(value => value.months)
  const xMin = Math.max(1, Math.min(...impacts) - 0.4)
  const xMax = Math.min(5, Math.max(...impacts) + 0.4)
  const low = Math.min(...months), high = Math.max(...months)
  const padding = Math.max(1, (high - low) * 0.15)
  const step = niceStep((high - low + 2 * padding) / 6)
  let yMin = Math.max(0, Math.floor((low - padding) / step) * step)
  let yMax = Math.ceil((high + padding) / step) * step
  if (yMax <= yMin) yMax = yMin + Math.max(1, step)
  // Avoid floating point labels when the step is fractional.
  yMin = Number(yMin.toFixed(2)); yMax = Number(yMax.toFixed(2))
  const yTicks = Array.from({ length: Math.floor((yMax - yMin) / step) + 1 }, (_, i) => Number((yMin + i * step).toFixed(2)))
  return {
    x: [Number(xMin.toFixed(1)), Number(xMax.toFixed(1))], y: [yMin, yMax],
    xTicks: [1, 2, 3, 4, 5].filter(value => value >= xMin && value <= xMax),
    yTicks, fittedCount: values.length,
  }
}

export const axisRangeLabel = (bounds: AxisBounds) =>
  `Visible range: impact ${bounds.x[0]}–${bounds.x[1]} / 5 · time ${bounds.y[0]}–${bounds.y[1]} months`
