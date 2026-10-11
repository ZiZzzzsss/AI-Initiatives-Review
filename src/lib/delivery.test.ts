import { describe, expect, it } from 'vitest'
import { readiness } from './assessment'
import { blankInitiative, demoPortfolio } from './data'
import { normalizeDelivery, timelineHorizon, validateDelivery } from './delivery'
import { parseImport } from './storage'

describe('delivery assessment',()=>{
  it('keeps demo assessments illustrative and leaves chart coordinates intact',()=>{
    const [pitch,crm,pricing]=demoPortfolio().initiatives
    expect([pitch.scenarios.base.months,crm.scenarios.base.months,pricing.scenarios.base.months]).toEqual([3,6,10])
    expect(pitch.deliveryAssessment.technicalComplexity.rating).toBe('Low')
    expect(crm.deliveryAssessment.technicalComplexity.rating).toBe('High')
    expect(pricing.deliveryAssessment.dataReadiness.status).toBe('Unknown')
    expect(pricing.deliveryAssessment.technicalComplexity.explanation).toContain('no deployed AI pricing tool')
    for(const item of [pitch,crm,pricing]){
      expect(item.scenarios.base.timeline.timingAssumptions).toContain('Illustrative')
      expect(validateDelivery(item)).toEqual([])
    }
  })
  it('allows overlapping phases and does not derive first value from their durations',()=>{
    const item=demoPortfolio().initiatives[2]
    const base=item.scenarios.base
    expect(base.timeline.phases.development.start).toBeLessThan(base.timeline.phases.discoveryData.start!+base.timeline.phases.discoveryData.duration!)
    expect(base.months).toBe(10)
    base.timeline.phases.rollout.duration=12
    expect(base.months).toBe(10)
    expect(timelineHorizon(base)).toBeGreaterThanOrEqual(22)
  })
  it('requires explanations and paired phase estimates while keeping complexity separate from gates',()=>{
    const item=blankInitiative()
    item.deliveryAssessment.technicalComplexity.rating='Very High'
    expect(validateDelivery(item)).toContain('Technical Complexity needs a short explanation.')
    expect(readiness(item)).toBe('Needs validation')
    item.deliveryAssessment.technicalComplexity.explanation='Model validation is extensive.'
    item.scenarios.base.timeline.phases.pilot.start=2
    expect(validateDelivery(item).some(error=>error.includes('Pilot operation needs both'))).toBe(true)
    item.scenarios.base.timeline.phases.pilot.duration=1
    item.scenarios.base.timeline.timingAssumptions='Pilot overlaps evaluation.'
    expect(validateDelivery(item)).toEqual([])
  })
  it('migrates an old portfolio without losing its existing values',()=>{
    const portfolio=demoPortfolio()
    const original=portfolio.initiatives[0]
    const legacy=JSON.parse(JSON.stringify(portfolio))
    delete legacy.initiatives[0].deliveryAssessment
    delete legacy.initiatives[0].deliveryAssessmentVersion
    for(const key of ['conservative','base','optimistic'])delete legacy.initiatives[0].scenarios[key].timeline
    const migrated=parseImport(JSON.stringify(legacy)).initiatives[0]
    expect(migrated.scenarios.base.months).toBe(original.scenarios.base.months)
    expect(migrated.scenarios.base.pilotCost).toBe(original.scenarios.base.pilotCost)
    expect(migrated.archetype).toBe(original.archetype)
    expect(migrated.deliveryAssessment.dataReadiness.status).toBe('Partially Ready')
    expect(migrated.scenarios.base.timeline.phases.pilot.start).toBe(1)
    expect(normalizeDelivery(migrated)).toEqual(migrated)
  })
  it('leaves custom legacy initiatives unassessed instead of assigning demo assumptions',()=>{
    const legacy=JSON.parse(JSON.stringify(demoPortfolio()))
    legacy.initiatives[0].scenarios.base.months=7
    delete legacy.initiatives[0].deliveryAssessment
    delete legacy.initiatives[0].deliveryAssessmentVersion
    delete legacy.initiatives[0].scenarios.base.timeline
    const migrated=parseImport(JSON.stringify(legacy)).initiatives[0]
    expect(migrated.scenarios.base.months).toBe(7)
    expect(migrated.deliveryAssessment.dataReadiness.status).toBeNull()
    expect(migrated.scenarios.base.timeline.phases.pilot.start).toBeNull()
  })
})
