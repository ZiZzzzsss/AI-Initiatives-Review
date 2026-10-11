import type { DeliveryAssessment, DeliveryTimeline, Initiative, Scenario, TimelinePhaseKey } from '../types'

export const timelinePhases: {key:TimelinePhaseKey; label:string}[] = [
  {key:'discoveryData',label:'Discovery & data preparation'},
  {key:'development',label:'Development / configuration'},
  {key:'integration',label:'Technical integration'},
  {key:'pilot',label:'Pilot operation'},
  {key:'evaluation',label:'Pilot evaluation'},
  {key:'adoption',label:'Adoption & first benefits'},
  {key:'rollout',label:'Wider rollout (optional)'},
]
export const dataReadinessOptions = ['Ready','Partially Ready','Not Ready','Unknown'] as const
export const complexityOptions = ['Low','Medium','High','Very High'] as const
export const measurabilityOptions = ['Low','Medium','High','Very High','Unknown'] as const

export function blankDeliveryAssessment():DeliveryAssessment {
  return {
    dataReadiness:{status:null,sources:'',explanation:''},
    technicalComplexity:{rating:null,explanation:''},
    implementationComplexity:{rating:null,explanation:''},
    evidenceMeasurability:{rating:null,method:'',limitations:''},
    decision:{blockers:'',dependencies:'',timingDrivers:'',accelerators:'',pilotKpis:''},
  }
}

export function blankDeliveryTimeline():DeliveryTimeline {
  return {
    phases:Object.fromEntries(timelinePhases.map(({key})=>[key,{start:null,duration:null}])) as DeliveryTimeline['phases'],
    pilotCompletion:null,evidenceReady:null,timingAssumptions:'',
  }
}

const text = (value:unknown) => typeof value==='string'?value:''
const month = (value:unknown) => typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=120?value:null

export function normalizeDeliveryAssessment(value:unknown):DeliveryAssessment {
  const source=value&&typeof value==='object'?value as Partial<DeliveryAssessment>:{}
  const blank=blankDeliveryAssessment()
  const data=source.dataReadiness,technical=source.technicalComplexity,implementation=source.implementationComplexity,evidence=source.evidenceMeasurability,decision=source.decision
  return {
    dataReadiness:{status:dataReadinessOptions.find(option=>option===data?.status)??null,sources:text(data?.sources),explanation:text(data?.explanation)},
    technicalComplexity:{rating:complexityOptions.find(option=>option===technical?.rating)??null,explanation:text(technical?.explanation)},
    implementationComplexity:{rating:complexityOptions.find(option=>option===implementation?.rating)??null,explanation:text(implementation?.explanation)},
    evidenceMeasurability:{rating:measurabilityOptions.find(option=>option===evidence?.rating)??null,method:text(evidence?.method),limitations:text(evidence?.limitations)},
    decision:{...blank.decision,blockers:text(decision?.blockers),dependencies:text(decision?.dependencies),timingDrivers:text(decision?.timingDrivers),accelerators:text(decision?.accelerators),pilotKpis:text(decision?.pilotKpis)},
  }
}

export function normalizeDeliveryTimeline(value:unknown):DeliveryTimeline {
  const source=value&&typeof value==='object'?value as Partial<DeliveryTimeline>:{}
  return {
    phases:Object.fromEntries(timelinePhases.map(({key})=>[key,{start:month(source.phases?.[key]?.start),duration:month(source.phases?.[key]?.duration)}])) as DeliveryTimeline['phases'],
    pilotCompletion:month(source.pilotCompletion),evidenceReady:month(source.evidenceReady),timingAssumptions:text(source.timingAssumptions),
  }
}

export function normalizeDelivery(item:Initiative):Initiative {
  return {...item,deliveryAssessment:normalizeDeliveryAssessment(item.deliveryAssessment),scenarios:Object.fromEntries((['conservative','base','optimistic'] as const).map(key=>[key,{...item.scenarios[key],timeline:normalizeDeliveryTimeline(item.scenarios[key].timeline)}])) as Initiative['scenarios']}
}

export function timelineHasEstimates(timeline:DeliveryTimeline) {
  return timeline.pilotCompletion!==null||timeline.evidenceReady!==null||timelinePhases.some(({key})=>timeline.phases[key].start!==null||timeline.phases[key].duration!==null)
}

export function timelineHorizon(scenario:Scenario) {
  const t=scenario.timeline
  const ends=timelinePhases.map(({key})=>{const phase=t.phases[key];return phase.start!==null&&phase.duration!==null?phase.start+phase.duration:0})
  return Math.max(12,Math.ceil(Math.max(scenario.months??0,t.pilotCompletion??0,t.evidenceReady??0,...ends)/3)*3)
}

export function validateDelivery(item:Initiative):string[] {
  const d=item.deliveryAssessment,errors:string[]=[]
  if(d.dataReadiness.status&&(!d.dataReadiness.sources.trim()||!d.dataReadiness.explanation.trim()))errors.push('Data Readiness needs required sources and a status explanation.')
  if(d.technicalComplexity.rating&&!d.technicalComplexity.explanation.trim())errors.push('Technical Complexity needs a short explanation.')
  if(d.implementationComplexity.rating&&!d.implementationComplexity.explanation.trim())errors.push('Implementation Complexity needs a short explanation.')
  if(d.evidenceMeasurability.rating&&(!d.evidenceMeasurability.method.trim()||!d.evidenceMeasurability.limitations.trim()))errors.push('Evidence Measurability needs an evaluation method and its limitations.')
  for(const key of ['conservative','base','optimistic'] as const){
    const timeline=item.scenarios[key].timeline
    for(const {key:phaseKey,label} of timelinePhases){const phase=timeline.phases[phaseKey];if((phase.start===null)!==(phase.duration===null))errors.push(`${label} needs both a start month and duration in ${key}.`);if(phase.start!==null&&phase.duration!==null&&(!Number.isFinite(phase.start)||!Number.isFinite(phase.duration)||phase.start<0||phase.duration<0||phase.start+phase.duration>120))errors.push(`${label} must fit within 0–120 months in ${key}.`)}
    for(const [label,value] of [['Pilot completion',timeline.pilotCompletion],['Decision-ready evidence',timeline.evidenceReady]] as const){if(value!==null&&(!Number.isFinite(value)||value<0||value>120))errors.push(`${label} must be 0–120 months in ${key}.`)}
    if(timelineHasEstimates(timeline)&&!timeline.timingAssumptions.trim())errors.push(`Timeline assumptions are needed in ${key}.`)
  }
  return errors
}
