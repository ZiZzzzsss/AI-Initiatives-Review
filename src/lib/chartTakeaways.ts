import type { PilotHardGateStatus } from './assessment'

export type DecisionPoint = {
  id: string
  impact: number
  cost: number
  months: number
  evidenceReady: number | null
  gates: PilotHardGateStatus
  uncertainty: string
}

export type ChartTakeaway = { subtitle: string; takeaway: string; tradeOff: string }

const uniqueExtreme = (values: number[], value: number, direction: 'min' | 'max') => {
  const extreme = direction === 'min' ? Math.min(...values) : Math.max(...values)
  return value === extreme && values.filter(candidate => candidate === extreme).length === 1
}
const between = (values: number[], value: number) => value > Math.min(...values) && value < Math.max(...values)
const firstSentence = (value: string) => value.trim().split(/(?<=[.!?])\s+/)[0].replace(/[.!?]+$/, '')

export function chartTakeaways(points: DecisionPoint[]): Record<string, ChartTakeaway> {
  const impacts = points.map(point => point.impact)
  const costs = points.map(point => point.cost)
  const months = points.map(point => point.months)
  const evidence = points.every(point => point.evidenceReady !== null) ? points.map(point => point.evidenceReady as number) : []
  return Object.fromEntries(points.map(point => {
    const comparable = points.length > 1
    const highImpact = comparable && uniqueExtreme(impacts, point.impact, 'max')
    const lowCost = comparable && uniqueExtreme(costs, point.cost, 'min')
    const highCost = comparable && uniqueExtreme(costs, point.cost, 'max')
    const fastValue = comparable && uniqueExtreme(months, point.months, 'min')
    const slowValue = comparable && uniqueExtreme(months, point.months, 'max')
    const earlyEvidence = evidence.length > 1 && uniqueExtreme(evidence, point.evidenceReady as number, 'min')
    const middleCost = points.length > 2 && between(costs, point.cost)
    const middleTime = points.length > 2 && between(months, point.months)
    let subtitle: string
    let takeaway: string
    if (point.gates === 'Blocked') {
      subtitle = 'Pilot gates blocked'
      takeaway = 'This initiative remains visible for comparison, but a pilot eligibility gate is blocked.'
    } else if (!comparable) {
      subtitle = 'Assess this pilot'
      takeaway = 'The only visible initiative has no peer comparison in the current chart view.'
    } else if (highImpact && lowCost) {
      subtitle = 'Higher impact, lower cost'
      takeaway = 'It combines the highest assessed impact with the lowest pilot investment among visible initiatives.'
    } else if (lowCost && fastValue) {
      subtitle = earlyEvidence ? 'Fastest, lowest-cost pilot' : 'Fastest value, lowest cost'
      takeaway = 'It has the lowest pilot investment and shortest time to value among visible initiatives.'
    } else if (highImpact && highCost) {
      subtitle = 'Higher impact, larger commitment'
      takeaway = 'It has the highest assessed impact and largest pilot investment among visible initiatives.'
    } else if (earlyEvidence) {
      subtitle = 'Earliest decision evidence'
      takeaway = 'Its decision-ready evidence is estimated sooner than for the other visible initiatives.'
    } else if (middleCost && middleTime) {
      subtitle = 'Intermediate investment and timeline'
      takeaway = 'It sits between visible initiatives on pilot investment and time to value.'
    } else if (highImpact) {
      subtitle = 'Higher potential impact'
      takeaway = 'It has the highest assessed Business Impact among visible initiatives.'
    } else if (lowCost) {
      subtitle = 'Lower-cost pilot'
      takeaway = 'It requires the lowest pilot investment among visible initiatives.'
    } else if (fastValue) {
      subtitle = 'Faster time to value'
      takeaway = 'It reaches first meaningful value sooner than the other visible initiatives.'
    } else if (highCost || slowValue) {
      subtitle = highCost ? 'Larger pilot investment' : 'Longer time to value'
      takeaway = highCost ? 'It requires the largest pilot investment among visible initiatives.' : 'Its first meaningful value comes later than for the other visible initiatives.'
    } else if (middleCost) {
      subtitle = 'Intermediate pilot investment'
      takeaway = 'Its pilot investment falls between the visible alternatives.'
    } else {
      subtitle = 'Compare pilot trade-offs'
      takeaway = 'Its impact, timing and cost should be compared with the other visible initiatives.'
    }
    const uncertainty = firstSentence(point.uncertainty)
    const tradeOff = point.gates === 'Blocked'
      ? 'Resolve the blocked pilot eligibility check before launch.'
      : uncertainty ? `Main uncertainty: ${uncertainty}.`
      : point.gates === 'Pending' ? 'Some pilot eligibility checks remain unconfirmed.'
      : highCost ? 'The larger investment increases the commitment needed to test the case.'
      : 'Validate the expected benefit against current practice.'
    return [point.id, { subtitle, takeaway, tradeOff }]
  }))
}
