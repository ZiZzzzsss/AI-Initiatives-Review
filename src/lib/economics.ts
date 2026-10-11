import type { EconomicAssumption, EconomicModel, EconomicScenario, ImpactThresholds, Initiative, ScenarioKey } from '../types'

export const defaultThresholds: ImpactThresholds = [0, 100_000, 500_000, 2_000_000]
export const modelNames: Record<EconomicModel, string> = { pricing: 'Predictive Pricing', crm: 'Automated CRM Data Enrichment', pitch: 'GenAI Pitch Writer' }
export type InputDefinition = { key: string; label: string; unit: 'EUR' | '%' | 'pp' | 'count' | 'hours' | 'EUR/hour'; help: string }
export const modelInputs: Record<EconomicModel, InputDefinition[]> = {
  pricing: [
    {key:'eligibleRevenue',label:'Eligible annual hotel room revenue',unit:'EUR',help:'Room revenue eligible for the deployment; this is hotel revenue, not Accor revenue.'},
    {key:'uplift',label:'Incremental RevPAR uplift versus current practice',unit:'%',help:'Additional uplift above existing pricing performance.'},
    {key:'reach',label:'Deployment reach',unit:'%',help:'Share of eligible activity reached.'},
    {key:'capture',label:'Accor contribution capture rate',unit:'%',help:'Simplifying estimate of the share of incremental hotel revenue captured as Accor contribution.'},
  ],
  crm: [
    {key:'opportunityValue',label:'Annual eligible commercial opportunity value',unit:'EUR',help:'Value of opportunities in scope, not booked revenue.'},
    {key:'baselineWin',label:'Baseline sales win rate',unit:'%',help:'Used to check that the assumed absolute improvement is possible.'},
    {key:'affected',label:'Opportunities materially affected by poor CRM data',unit:'%',help:'Data quality only creates economic value here if it improves conversion.'},
    {key:'winUplift',label:'Win-rate improvement on affected opportunities',unit:'pp',help:'Absolute percentage points, not a relative percent change.'},
    {key:'reach',label:'Deployment reach',unit:'%',help:'Share of eligible opportunities reached.'},
    {key:'capture',label:'Accor contribution capture rate',unit:'%',help:'Estimated contribution from additional converted sales.'},
  ],
  pitch: [
    {key:'proposals',label:'Annual eligible proposal volume',unit:'count',help:'Existing qualified proposals per year.'},
    {key:'valuePerProposal',label:'Average commercial value per proposal',unit:'EUR',help:'Gross commercial value, before contribution capture.'},
    {key:'baselineWin',label:'Baseline proposal win rate',unit:'%',help:'Existing win rate.'},
    {key:'winUplift',label:'Absolute win-rate improvement',unit:'pp',help:'Percentage points added to baseline, not relative growth.'},
    {key:'reach',label:'Adoption reach',unit:'%',help:'Share of existing proposal work using the tool.'},
    {key:'draftHours',label:'Drafting hours per proposal',unit:'hours',help:'Average drafting effort before assistance.'},
    {key:'timeSaving',label:'Time-saving rate',unit:'%',help:'Share of drafting time released on adopted work.'},
    {key:'redeployment',label:'Released hours redeployed to proposals',unit:'%',help:'Maximum share of released hours used for extra qualified proposals.'},
    {key:'demand',label:'Additional qualified proposal demand',unit:'count',help:'Caps extra proposals; no demand means no capacity benefit.'},
    {key:'realizable',label:'Realizable cost-saving share of non-redeployed time',unit:'%',help:'Only cash-realizable savings count.'},
    {key:'hourlyCost',label:'Fully loaded hourly labor cost',unit:'EUR/hour',help:'Used only for realizable operating savings.'},
    {key:'capture',label:'Accor contribution capture rate',unit:'%',help:'Contribution from incremental commercial wins.'},
  ],
}
export const operatingCostInput: InputDefinition = {key:'operatingCost',label:'Incremental annual operating costs',unit:'EUR',help:'Recurring model, license and operating expense; pilot and rollout investments stay separate.'}
export const allInputs = (model: EconomicModel) => [...modelInputs[model], operatingCostInput]
export const validThresholds = (t: unknown): t is ImpactThresholds => Array.isArray(t) && t.length===4 && t.every((n,i)=>typeof n==='number' && Number.isFinite(n) && (i===0 || n>t[i-1]))
export function impactRating(net: number, thresholds: ImpactThresholds): number | null {
  if (!Number.isFinite(net) || !validThresholds(thresholds)) return null
  return 1 + thresholds.filter(t=>net>=t).length
}
export type EconomicResult = { status:'calculated'; model:EconomicModel; created:number; captured:number; savings:number; operatingCost:number; net:number; components:Record<string,number> } | { status:'not-calculated'; errors:string[] }
export function calculateEconomic(e: EconomicScenario | undefined): EconomicResult {
  if (!e) return {status:'not-calculated',errors:['No economic model is assigned.']}
  if (!Object.hasOwn(modelInputs,e.model)) return {status:'not-calculated',errors:['Unknown economic model.']}
  const errors:string[]=[]
  for(const field of allInputs(e.model)) {
    const v=e.inputs?.[field.key]
    if(v===null || v===undefined) errors.push(`${field.label} is missing.`)
    else if(typeof v!=='number' || !Number.isFinite(v) || v<0 || ((field.unit==='%' || field.unit==='pp') && v>100) || (field.unit==='count' && !Number.isInteger(v))) errors.push(`${field.label} is invalid.`)
  }
  if(errors.length)return {status:'not-calculated',errors}
  const v=(key:string)=>e.inputs[key] as number
  if((e.model==='crm'||e.model==='pitch') && v('baselineWin')+v('winUplift')>100)return {status:'not-calculated',errors:['Baseline win rate plus absolute uplift exceeds 100%.']}
  let created=0,captured=0,savings=0
  let components:Record<string,number>={}
  if(e.model==='pricing') {
    created=v('eligibleRevenue')*v('uplift')/100*v('reach')/100
    captured=created*v('capture')/100
    components={incrementalHotelRevenue:created,capturedContribution:captured}
  } else if(e.model==='crm') {
    created=v('opportunityValue')*v('affected')/100*v('reach')/100*v('winUplift')/100
    captured=created*v('capture')/100
    components={incrementalConvertedSales:created,capturedContribution:captured}
  } else {
    const adopted=v('proposals')*v('reach')/100
    const extraExistingWins=adopted*v('winUplift')/100
    const releasedHours=adopted*v('draftHours')*v('timeSaving')/100
    const afterHours=v('draftHours')*(1-v('timeSaving')/100)
    const capacity=afterHours>0 ? releasedHours*v('redeployment')/100/afterHours : 0
    const extraProposals=Math.min(v('demand'),capacity)
    const extraCapacityWins=extraProposals*(v('baselineWin')+v('winUplift'))/100
    created=(extraExistingWins+extraCapacityWins)*v('valuePerProposal')
    captured=created*v('capture')/100
    savings=releasedHours*(1-v('redeployment')/100)*v('realizable')/100*v('hourlyCost')
    components={extraExistingWins,extraProposals,extraCapacityWins,releasedHours,additionalCommercialValue:created,capturedCommercialContribution:captured,realizableOperatingSavings:savings}
  }
  const net=captured+savings-v('operatingCost')
  if([created,captured,savings,net,...Object.values(components)].some(n=>!Number.isFinite(n)))return {status:'not-calculated',errors:['The result exceeds the supported numeric range.']}
  return {status:'calculated',model:e.model,created,captured,savings,operatingCost:v('operatingCost'),net,components}
}
export function effectiveImpact(i:Initiative,key:ScenarioKey,thresholds:ImpactThresholds=defaultThresholds):number|null {
  const s=i.scenarios[key],e=s.economic
  if(!e || e.mode==='manual')return s.impact
  if(e.overrideImpact!==null && Number.isInteger(e.overrideImpact) && e.overrideImpact>=1 && e.overrideImpact<=5 && e.overrideRationale.trim())return e.overrideImpact
  const result=calculateEconomic(e)
  return result.status==='calculated'?impactRating(result.net,thresholds):null
}
export function newEconomic(model:EconomicModel, values:Record<string,number>):EconomicScenario {
  return {model,mode:'modelled',inputs:Object.fromEntries(allInputs(model).map(f=>[f.key,values[f.key]??null])),evidence:Object.fromEntries(allInputs(model).map(f=>[f.key,{source:'Expert judgment',reference:'',explanation:'Illustrative planning input, not validated Accor data.',pilotValidation:'Measure against a credible baseline during the pilot.'} satisfies EconomicAssumption])),overrideImpact:null,overrideRationale:''}
}
export function sensitivity(e:EconomicScenario,thresholds:ImpactThresholds, peers: number[]=[]){
  const base=calculateEconomic(e)
  if(base.status!=='calculated')return []
  return allInputs(e.model).map(f=>{
    const current=e.inputs[f.key] as number
    const delta=Math.max(1,current*.1)
    const limit=f.unit==='%'||f.unit==='pp'?100:Number.MAX_VALUE
    const candidates=[Math.min(limit,current+delta),Math.max(0,current-delta)].map(value=>{const to=f.unit==='count'?Math.round(value):value;return {to,result:calculateEconomic({...e,inputs:{...e.inputs,[f.key]:to}})}}).filter((x):x is {to:number;result:Extract<EconomicResult,{status:'calculated'}>}=>x.result.status==='calculated'&&x.to!==current)
    if(!candidates.length)return null
    const chosen=candidates.sort((a,b)=>Math.abs(b.result.net-base.net)-Math.abs(a.result.net-base.net))[0]
    return {key:f.key,label:f.label,from:current,to:chosen.to,change:chosen.result.net-base.net,crosses:impactRating(chosen.result.net,thresholds)!==impactRating(base.net,thresholds),reorders:peers.some(p=>(base.net-p)*(chosen.result.net-p)<0)}
  }).filter((x):x is NonNullable<typeof x>=>x!==null).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change))
}
