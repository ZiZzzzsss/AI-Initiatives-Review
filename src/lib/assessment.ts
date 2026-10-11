import type { Descriptor, Initiative, Scenario, ScenarioKey, Urgency } from '../types'
import { feasibilityLabels } from './metadata'
export const scenarioNames: Record<ScenarioKey, string> = { conservative: 'Conservative', base: 'Base', optimistic: 'Optimistic' }
export const scenarioKeys: ScenarioKey[] = ['conservative','base','optimistic']
export const validImpact = (n: number | null) => n !== null && Number.isInteger(n) && n >= 1 && n <= 5
export const validMonths = (n: number | null) => n !== null && Number.isFinite(n) && n >= 0 && n <= 120
export const validCost = (n: number | null) => n !== null && Number.isFinite(n) && n >= 0
export const pilotTotal = (s: Scenario) => s.costMode === 'advanced' ? Object.values(s.costs).reduce((a,b) => a + (Number.isFinite(b) && b >= 0 ? b : 0), 0) : s.pilotCost
export const isComplete = (i: Initiative, key: ScenarioKey) => Boolean(i.name.trim() && i.archetype && validImpact(i.scenarios[key].impact) && validMonths(i.scenarios[key].months) && validCost(pilotTotal(i.scenarios[key])) && i.scenarios[key].urgency)
export const readiness = (i: Initiative) => {
  const states = feasibilityLabels.map(k => i.feasibility[k] || 'Unconfirmed')
  if (states.includes('Blocked')) return 'Blocked'
  if (states.some(s => s === 'Unconfirmed')) return 'Needs validation'
  return 'Ready to test'
}
export const suggestUrgency = (i: Initiative): { level: Urgency; reason: string } => {
  const u = i.urgencyInputs
  let level: Urgency = u.severity
  const reasons = [`${u.severity.toLowerCase()} severity of the underlying problem`]
  if (u.workaround && u.workaroundEffectiveness === 'High' && u.residualProblem.trim() === '') {
    level = level === 'Critical' ? 'High' : level === 'High' ? 'Moderate' : 'Low'
    reasons.push('an effective temporary workaround')
  }
  if (u.deadline && level !== 'Critical') { level = level === 'Low' ? 'Moderate' : level === 'Moderate' ? 'High' : 'Critical'; reasons.push('a stated deadline') }
  if (u.dependencyType === 'Mandatory' && u.dependencyStatus === 'Committed' && !u.alternative && level !== 'Critical') {
    level = level === 'Low' ? 'Moderate' : level === 'Moderate' ? 'High' : 'Critical'; reasons.push('a mandatory committed dependency')
  }
  return { level, reason: `Guidance considers ${reasons.join(', ')}. Confirm or override based on the residual consequences of delay.` }
}
export const suggestDescriptor = (i: Initiative): {name:Descriptor;reason:string}|null => {
  const s=i.scenarios.base
  if(s.urgency==='Critical')return {name:'Critical Fix',reason:'The confirmed residual urgency is Critical.'}
  if(s.impact!==null&&s.impact>=4)return {name:'High-Impact Opportunity',reason:'The confirmed Business Impact is High or Very High.'}
  if(s.months!==null&&s.months<=3&&s.impact!==null)return {name:'Quick Win',reason:'Meaningful value is expected within three months.'}
  if(s.months!==null&&s.months>=12)return {name:'Long-Horizon Opportunity',reason:'First meaningful value is estimated at 12 months or more.'}
  return null
}
export const bubbleRadius = (cost: number, maxCost: number) => Math.max(8, Math.min(34, Math.sqrt(cost / Math.max(maxCost, 1)) * 34))
export const yPosition = (months: number, min: number, max: number, height: number) => (months - min) / (max - min) * height
export const warnings = (i: Initiative, key: ScenarioKey) => {
  const a: string[] = []
  if (!isComplete(i,key)) a.push('Incomplete assessment: chart inputs are missing or invalid.')
  if (!i.scenarios[key].impactRationale.trim()) a.push('Business Impact rationale has not been recorded.')
  if (!i.meaningfulKpi.trim() || !i.meaningfulThreshold.trim()) a.push('Define the KPI and threshold for meaningful business value.')
  if (readiness(i) === 'Blocked') a.push('A feasibility check is blocked.')
  if (i.evidenceSource === 'Unknown') a.push('Impact evidence source is unknown.')
  return a
}
export const managementInterpretation = (i: Initiative, key: ScenarioKey) => {
  const s = i.scenarios[key]
  const time = s.months === null ? 'time to value is unassessed' : `first meaningful value is expected in ${s.months} months`
  const impact = s.impact === null ? 'business impact is unassessed' : `assessed impact is ${s.impact}/5`
  return `${i.name || 'This initiative'} is a ${i.archetype || 'yet-to-be-classified initiative'}; ${impact} and ${time}. Pilot investment is ${pilotTotal(s) === null ? 'unassessed' : new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(pilotTotal(s) as number)}. Residual urgency is ${s.urgency || 'unassessed'}. ${readiness(i) === 'Blocked' ? 'A blocked feasibility item needs resolution. ' : ''}${i.validationAssumptions ? `Key uncertainty: ${i.validationAssumptions}` : 'Key assumptions still need validation.'}`
}
export const compareSummary = (items: Initiative[], key: ScenarioKey) => {
  if (items.length < 2) return 'Select two to four initiatives to explore trade-offs.'
  const [a,b] = items
  const x = a.scenarios[key], y = b.scenarios[key]
  const parts: string[] = []
  if (x.impact !== null && y.impact !== null && x.impact !== y.impact) parts.push(`${x.impact > y.impact ? a.name : b.name} has higher assessed impact`)
  if (x.months !== null && y.months !== null && x.months !== y.months) parts.push(`${x.months < y.months ? a.name : b.name} reaches meaningful value sooner`)
  const cx=pilotTotal(x), cy=pilotTotal(y)
  if (cx !== null && cy !== null && cx !== cy) parts.push(`${cx < cy ? a.name : b.name} requires less pilot investment`)
  const blocked=items.filter(i=>readiness(i)==='Blocked').map(i=>i.name)
  if (blocked.length) parts.push(`${blocked.join(' and ')} ${blocked.length===1?'has':'have'} a blocked feasibility item`)
  return `${parts.length ? parts.join('; ') + '. ' : ''}The preferred investment depends on management objectives, constraints, and the evidence still to validate.`
}
