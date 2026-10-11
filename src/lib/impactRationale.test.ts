import { describe, expect, it } from 'vitest'
import { demoPortfolio } from './data'
import { effectiveImpact, suggestImpact } from './impactGuide'
import { counterfactualImpact, defaultCounterfactual, impactDecision, impactWhy } from './impactRationale'

describe('Business Impact decision rationale', () => {
  it('derives the three seeded base counterfactuals from the existing guide', () => {
    const [pitch, crm, pricing] = demoPortfolio().initiatives
    const cases = [
      [pricing, 'incremental', 'negligible', 4, 1],
      [crm, 'effectiveness', 'limited', 4, 2],
      [pitch, 'realization', 'low', 3, 2],
    ] as const
    for (const [item, field, alternative, current, expected] of cases) {
      const assessment = item.scenarios.base.impactAssessment!
      expect(suggestImpact(assessment).score).toBe(current)
      expect(defaultCounterfactual(assessment, field)).toBe(alternative)
      expect(counterfactualImpact(assessment, field, alternative).score).toBe(expected)
      expect(suggestImpact(assessment).score).toBe(current)
    }
  })

  it('previews without changing the scenario, chart rating, or management override', () => {
    const pricing = demoPortfolio().initiatives[2]
    const assessment = pricing.scenarios.base.impactAssessment!
    assessment.mode = 'confirmed'
    assessment.confirmedImpact = 5
    assessment.confirmationRationale = 'Management has independent evidence.'
    const before = structuredClone(pricing.scenarios.base)
    expect(counterfactualImpact(assessment, 'incremental', 'negligible').score).toBe(1)
    expect(assessment.assumptions.incremental.value).toBe('moderate')
    expect(effectiveImpact(pricing, 'base')).toBe(5)
    expect(pricing.scenarios.base).toEqual(before)
  })

  it('keeps the explanation aligned with changed assumptions and scenario', () => {
    const pricing = demoPortfolio().initiatives[2]
    const base = pricing.scenarios.base.impactAssessment!
    expect(impactWhy(base)).toContain('high potential Business Impact (4/5)')
    base.assumptions.incremental.value = 'negligible'
    expect(impactWhy(base)).toContain('negligible incremental improvement')
    expect(impactWhy(base)).toContain('limited potential Business Impact (1/5)')
    expect(impactWhy(pricing.scenarios.conservative.impactAssessment!)).toContain('limited potential Business Impact (2/5)')
    expect(impactWhy(pricing.scenarios.optimistic.impactAssessment!)).toContain('high potential Business Impact (5/5)')
    expect(impactDecision(pricing, 'conservative', 1)).not.toContain('high-impact')
  })

  it('explains a binding assumption and treats impact separately from pilot choice', () => {
    const portfolio = demoPortfolio()
    const pricing = portfolio.initiatives[2]
    const base = pricing.scenarios.base.impactAssessment!
    const unchanged = counterfactualImpact(base, 'incremental', 'significant')
    expect(unchanged.score).toBe(4)
    expect(unchanged.limiting).toContain('Potential deployment reach: Multi-regional')
    expect(impactDecision(pricing, 'base', unchanged.score, portfolio.initiatives)).toContain('another assumption still limits')
    const downside = impactDecision(pricing, 'base', 1, portfolio.initiatives)
    expect(downside).toContain('revisit its priority')
    expect(downside).toContain('this preview does not decide the pilot')
  })
})
