import type { PilotHardGateStatus } from './assessment'
import type { Initiative, ScenarioKey } from '../types'
import { isChartable, pilotHardGateStatus, pilotTotal } from './assessment'
import { effectiveImpact } from './impactGuide'
import { validationRating } from './economicValidation'

export type DecisionPoint = { id:string; impact:number; validation:number; cost:number; evidenceReady:number|null; gates:PilotHardGateStatus; uncertainty:string }
export type ChartTakeaway = { subtitle:string; takeaway:string; tradeOff:string }

export function chartDecisionPoint(item:Initiative,scenario:ScenarioKey):DecisionPoint|null {
  if(!isChartable(item,scenario))return null
  const s=item.scenarios[scenario]
  return {id:item.id,impact:effectiveImpact(item,scenario)!,validation:validationRating(item,scenario)!,cost:pilotTotal(s)!,evidenceReady:s.timeline.evidenceReady,gates:pilotHardGateStatus(item),uncertainty:s.economicValidation?.mainUncertainty||s.impactAssessment?.uncertainty||item.validationAssumptions}
}

const uniqueExtreme=(values:number[],value:number,direction:'min'|'max')=>{
  const extreme=direction==='min'?Math.min(...values):Math.max(...values)
  return value===extreme&&values.filter(candidate=>candidate===extreme).length===1
}
const between=(values:number[],value:number)=>value>Math.min(...values)&&value<Math.max(...values)
const firstSentence=(value:string)=>value.trim().split(/(?<=[.!?])\s+/)[0].replace(/[.!?]+$/,'')

export function chartTakeaways(points:DecisionPoint[]):Record<string,ChartTakeaway> {
  const impacts=points.map(point=>point.impact),validations=points.map(point=>point.validation),costs=points.map(point=>point.cost)
  const evidence=points.every(point=>point.evidenceReady!==null)?points.map(point=>point.evidenceReady as number):[]
  return Object.fromEntries(points.map(point=>{
    const comparable=points.length>1
    const highImpact=comparable&&uniqueExtreme(impacts,point.impact,'max')
    const highValidation=comparable&&uniqueExtreme(validations,point.validation,'max')
    const lowCost=comparable&&uniqueExtreme(costs,point.cost,'min')
    const highCost=comparable&&uniqueExtreme(costs,point.cost,'max')
    const earlyEvidence=evidence.length>1&&uniqueExtreme(evidence,point.evidenceReady as number,'min')
    const lateEvidence=evidence.length>1&&uniqueExtreme(evidence,point.evidenceReady as number,'max')
    const middleCost=points.length>2&&between(costs,point.cost)
    const middleEvidence=evidence.length>2&&between(evidence,point.evidenceReady as number)
    let subtitle:string,takeaway:string
    if(point.gates==='Blocked'){
      subtitle='Pilot gates blocked';takeaway='This initiative remains in view, but a pilot eligibility check is blocked.'
    }else if(!comparable){
      subtitle='Assess this pilot';takeaway='This is the only visible initiative, so there is no peer comparison in the current view.'
    }else if(highImpact&&highValidation){
      subtitle='High potential, stronger evidence';takeaway='It combines the highest assessed impact with the strongest economic validation rating among visible initiatives.'
    }else if(highValidation){
      subtitle='Stronger validation potential';takeaway='Its pilot has the highest assessed ability to validate economic value among visible initiatives.'
    }else if(lowCost&&earlyEvidence){
      subtitle='Lower-cost, earlier evidence';takeaway='It has the lowest pilot investment and earliest estimated decision-ready evidence among visible initiatives.'
    }else if(highCost&&point.impact>=4){
      subtitle='High impact, larger commitment';takeaway='It offers high potential impact, with the largest pilot investment among visible initiatives.'
    }else if(middleCost&&middleEvidence){
      subtitle='Intermediate cost and evidence';takeaway='Its pilot investment and evidence timing sit between the visible alternatives.'
    }else if(highImpact){
      subtitle='Higher potential impact';takeaway='It has the highest assessed Business Impact among visible initiatives.'
    }else if(earlyEvidence){
      subtitle='Earlier decision evidence';takeaway='Decision-ready evidence is estimated sooner than for other visible initiatives.'
    }else if(lowCost){
      subtitle='Lower-cost pilot';takeaway='It requires the lowest pilot investment among visible initiatives.'
    }else if(highCost||lateEvidence){
      subtitle=highCost?'Larger pilot commitment':'Longer evidence timeline';takeaway=highCost?'It requires the largest pilot investment among visible initiatives.':'Decision-ready evidence is expected later than for the other visible initiatives.'
    }else{
      subtitle='Compare pilot trade-offs';takeaway='Compare its impact, validation strength and cost with the other visible initiatives.'
    }
    const uncertainty=firstSentence(point.uncertainty)
    const tradeOff=point.gates==='Blocked'?'Resolve the blocked pilot eligibility check before launch.':uncertainty?`Main uncertainty: ${uncertainty}.`:point.gates==='Pending'?'Some pilot eligibility checks remain unconfirmed.':'Test whether measured outcomes justify broader investment.'
    return [point.id,{subtitle,takeaway,tradeOff}]
  }))
}
