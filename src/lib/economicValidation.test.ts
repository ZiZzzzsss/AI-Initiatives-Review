import { describe, expect, it } from 'vitest'
import { blankInitiative, demoPortfolio } from './data'
import { evidenceColor, evidenceBands, unassessedEvidenceColor } from './evidenceColors'
import { normalizeEconomicValidation, validationRating } from './economicValidation'
import { chartAxisBounds } from './chartAxes'
import { isChartable } from './assessment'
import { migratePortfolio, portfolioCsv } from './storage'

describe('economic validation assessment',()=>{
  it('does not derive a validation score from old evidence or urgency',()=>{
    const item=blankInitiative()
    item.deliveryAssessment.evidenceMeasurability.rating='Very High'
    item.scenarios.base.urgency='Critical'
    expect(validationRating(item,'base')).toBeNull()
    item.scenarios.base.economicValidation!.rating=5
    expect(validationRating(item,'base')).toBeNull()
    item.scenarios.base.economicValidation!.rationale='A controlled comparison and cost assumptions are available.'
    expect(validationRating(item,'base')).toBe(5)
  })
  it('migrates older saved portfolios without inventing a score or losing timeline data',()=>{
    const portfolio=demoPortfolio()
    const prior=portfolio.initiatives[0].scenarios.base.timeline.evidenceReady
    for(const item of portfolio.initiatives)for(const key of ['conservative','base','optimistic'] as const)delete item.scenarios[key].economicValidation
    const migrated=migratePortfolio(portfolio)
    expect(validationRating(migrated.initiatives[0],'base')).toBeNull()
    expect(migrated.initiatives[0].scenarios.base.timeline.evidenceReady).toBe(prior)
    expect(isChartable(migrated.initiatives[0],'base')).toBe(false)
    expect(chartAxisBounds(migrated.initiatives,'base','fit',false).fittedCount).toBe(0)
  })
  it('keeps rating and hypothesis fields scenario-specific through normalization and CSV export',()=>{
    const portfolio=demoPortfolio(),item=portfolio.initiatives[0]
    item.scenarios.optimistic.economicValidation!.rating=4
    item.scenarios.optimistic.economicValidation!.rationale='Improved control design.'
    const migrated=migratePortfolio(portfolio)
    expect(validationRating(migrated.initiatives[0],'optimistic')).toBe(4)
    expect(validationRating(migrated.initiatives[0],'base')).toBe(2)
    expect(normalizeEconomicValidation({rating:7,rationale:'Invalid'}).rating).toBeNull()
    const csv=portfolioCsv(migrated,'base')
    expect(csv).toContain('Economic Value Validation (1–5)')
    expect(csv).toContain('Critical investment hypothesis')
    expect(csv).toContain('Pilot Hard Gates')
  })
  it('uses fixed time bands, with a distinct unknown color',()=>{
    expect(evidenceColor(3)).toBe(evidenceBands[0].color)
    expect(evidenceColor(3.5)).toBe(evidenceBands[1].color)
    expect(evidenceColor(6)).toBe(evidenceBands[1].color)
    expect(evidenceColor(10)).toBe(evidenceBands[2].color)
    expect(evidenceColor(null)).toBe(unassessedEvidenceColor)
    const items=demoPortfolio().initiatives
    expect(evidenceColor(items[0].scenarios.base.timeline.evidenceReady)).toBe(evidenceBands[0].color)
    expect(evidenceColor(items[0].scenarios.conservative.timeline.evidenceReady)).toBe(evidenceBands[1].color)
    expect(validationRating(items[2],'optimistic')).toBe(validationRating(items[2],'base'))
    expect(chartAxisBounds(items,'base','fit',false).fittedCount).toBe(3)
    expect(new Set(items.map(item=>item.archetype)).size).toBe(3)
  })
})
