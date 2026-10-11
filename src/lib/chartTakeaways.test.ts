import { describe, expect, it } from 'vitest'
import { chartTakeaways, type DecisionPoint } from './chartTakeaways'
import { demoPortfolio } from './data'
import { effectiveImpact } from './impactGuide'
import { pilotHardGateStatus, pilotTotal } from './assessment'
import type { Initiative, ScenarioKey } from '../types'

const point = (item: Initiative, key: ScenarioKey): DecisionPoint => ({
  id: item.id,
  impact: effectiveImpact(item, key)!,
  cost: pilotTotal(item.scenarios[key])!,
  months: item.scenarios[key].months!,
  evidenceReady: item.scenarios[key].timeline.evidenceReady,
  gates: pilotHardGateStatus(item),
  uncertainty: item.scenarios[key].impactAssessment?.uncertainty || item.validationAssumptions,
})

describe('chart decision takeaways', () => {
  it('explains the three illustrative base-case positions without initiative-name rules', () => {
    const items = demoPortfolio().initiatives
    expect(items.map(item => effectiveImpact(item, 'base'))).toEqual([3, 3, 4])
    const result = chartTakeaways(items.map(item => point(item, 'base')))
    expect(result[items[0].id].subtitle).toBe('Fastest, lowest-cost pilot')
    expect(result[items[1].id].subtitle).toBe('Intermediate investment and timeline')
    expect(result[items[2].id].subtitle).toBe('Higher impact, larger commitment')
    expect(result[items[2].id].tradeOff).toContain('current pricing systems')
  })
  it('updates for scenario, cost, evidence timing and visible set', () => {
    const items = demoPortfolio().initiatives
    const base = items.map(item => point(item, 'base'))
    const withoutEvidence = base.map(item => ({ ...item, evidenceReady: null }))
    expect(chartTakeaways(withoutEvidence)[items[0].id].subtitle).toBe('Fastest value, lowest cost')
    const slowerEvidence = base.map(item => ({ ...item, evidenceReady: item.id === items[0].id ? 12 : item.evidenceReady }))
    expect(chartTakeaways(slowerEvidence)[items[0].id].subtitle).toBe('Fastest value, lowest cost')
    const higherCost = base.map(item => ({ ...item, cost: item.id === items[0].id ? 250000 : item.cost }))
    expect(chartTakeaways(higherCost)[items[0].id].subtitle).not.toBe('Fastest, lowest-cost pilot')
    expect(chartTakeaways(base.slice(0, 1))[items[0].id].subtitle).toBe('Assess this pilot')
    expect(chartTakeaways(items.map(item => point(item, 'conservative')))[items[0].id].takeaway).toContain('time to value')
  })
  it('does not invent a unique rank for ties and clearly flags blocked gates', () => {
    const items = demoPortfolio().initiatives
    const base = items.map(item => point(item, 'base'))
    const tied = base.map(item => ({ ...item, cost: 50000, months: 6, evidenceReady: null }))
    const result = chartTakeaways(tied)
    expect(result[items[0].id].subtitle).not.toContain('lowest')
    const blocked = chartTakeaways(base.map(item => ({ ...item, gates: item.id === items[0].id ? 'Blocked' as const : item.gates })))
    expect(blocked[items[0].id].subtitle).toBe('Pilot gates blocked')
    expect(blocked[items[0].id].tradeOff).toContain('blocked pilot eligibility')
  })
})
