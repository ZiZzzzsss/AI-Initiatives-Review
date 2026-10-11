import { describe, expect, it } from 'vitest'
import { chartTakeaways, type DecisionPoint } from './chartTakeaways'
import { demoPortfolio } from './data'
import { effectiveImpact } from './impactGuide'
import { pilotHardGateStatus, pilotTotal } from './assessment'
import { validationRating } from './economicValidation'
import type { Initiative, ScenarioKey } from '../types'

const point=(item:Initiative,key:ScenarioKey):DecisionPoint=>({
  id:item.id,impact:effectiveImpact(item,key)!,validation:validationRating(item,key)!,cost:pilotTotal(item.scenarios[key])!,
  evidenceReady:item.scenarios[key].timeline.evidenceReady,gates:pilotHardGateStatus(item),
  uncertainty:item.scenarios[key].economicValidation?.mainUncertainty||'',
})

describe('pilot decision takeaways',()=>{
  it('describes the three illustrative base cases from their assessment values',()=>{
    const items=demoPortfolio().initiatives,result=chartTakeaways(items.map(item=>point(item,'base')))
    expect(result[items[0].id].subtitle).toBe('Lower-cost, earlier evidence')
    expect(result[items[1].id].subtitle).toBe('Intermediate cost and evidence')
    expect(result[items[2].id].subtitle).toBe('High impact, larger commitment')
    expect(result[items[2].id].tradeOff).toContain('current pricing')
  })
  it('updates for evidence time, validation rating, cost and visible set',()=>{
    const items=demoPortfolio().initiatives,base=items.map(item=>point(item,'base'))
    const withoutEvidence=base.map(item=>({...item,evidenceReady:null}))
    expect(chartTakeaways(withoutEvidence)[items[0].id].subtitle).toBe('Lower-cost pilot')
    const stronger=base.map(item=>({...item,validation:item.id===items[0].id?5:item.validation}))
    expect(chartTakeaways(stronger)[items[0].id].subtitle).toBe('Stronger validation potential')
    const higherCost=base.map(item=>({...item,cost:item.id===items[0].id?250000:item.cost}))
    expect(chartTakeaways(higherCost)[items[0].id].subtitle).not.toBe('Lower-cost, earlier evidence')
    expect(chartTakeaways(base.slice(0,1))[items[0].id].subtitle).toBe('Assess this pilot')
  })
  it('does not invent unique positions for ties and flags blocked gates',()=>{
    const items=demoPortfolio().initiatives,base=items.map(item=>point(item,'base'))
    const tied=base.map(item=>({...item,cost:50000,evidenceReady:null,validation:3}))
    expect(chartTakeaways(tied)[items[0].id].subtitle).not.toContain('Lower-cost')
    const blocked=chartTakeaways(base.map(item=>({...item,gates:item.id===items[0].id?'Blocked' as const:item.gates})))
    expect(blocked[items[0].id].subtitle).toBe('Pilot gates blocked')
  })
})
