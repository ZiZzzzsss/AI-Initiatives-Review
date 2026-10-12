import type { EvidenceSource, ImpactAssessment, ImpactAssumption, ImpactGuide, Initiative, ScenarioKey } from '../types'

type Choice = { value:string; label:string; ceiling:1|2|3|4|5; meaning:string }
export type GuideField = { key:string; label:string; why:string; choices:readonly Choice[] }
const reach:GuideField={key:'reach',label:'Potential deployment reach',why:'A broader eligible footprint can support a higher impact rating, if the improvement and value pathway also hold.',choices:[
  {value:'limited',label:'Limited',ceiling:2,meaning:'One bounded team or property group.'},
  {value:'regional',label:'Regional',ceiling:3,meaning:'A meaningful regional deployment.'},
  {value:'multi',label:'Multi-regional',ceiling:4,meaning:'Several regions or large business units.'},
  {value:'global',label:'Broad global',ceiling:5,meaning:'Potentially broad deployment across the group.'},
]}
export const guides:Record<ImpactGuide,{name:string;fields:readonly [GuideField,GuideField,GuideField]}>= {
  pricing:{name:'Predictive Pricing',fields:[
    {key:'incremental',label:'Incremental pricing improvement beyond existing systems',why:'Only gains beyond current revenue management practice are incremental.',choices:[
      {value:'negligible',label:'Negligible',ceiling:1,meaning:'Little credible gain over existing tools.'},
      {value:'small',label:'Small',ceiling:2,meaning:'A narrow improvement in pricing decisions.'},
      {value:'moderate',label:'Moderate',ceiling:4,meaning:'A meaningful improvement in participating hotels.'},
      {value:'significant',label:'Significant',ceiling:5,meaning:'A major incremental improvement, subject to a credible comparison.'},
    ]},reach,
    {key:'capture',label:'Accor economic contribution from improved hotel revenue',why:'Higher hotel revenue matters to this assessment only insofar as Accor captures incremental contribution.',choices:[
      {value:'low',label:'Low',ceiling:2,meaning:'Weak contribution pathway.'},
      {value:'moderate',label:'Moderate',ceiling:4,meaning:'Plausible contribution pathway requiring validation.'},
      {value:'high',label:'High',ceiling:5,meaning:'Strong plausible contribution pathway requiring validation.'},
      {value:'uncertain',label:'Uncertain',ceiling:3,meaning:'Capture mechanism is not yet clear.'},
    ]},
  ]},
  crm:{name:'Automated CRM Data Enrichment',fields:[
    {key:'bottleneck',label:'CRM data quality as a commercial bottleneck',why:'Poor records must materially constrain commercial work for the initiative to have broad potential.',choices:[
      {value:'low',label:'Low',ceiling:2,meaning:'Limited commercial friction from data quality.'},
      {value:'moderate',label:'Moderate',ceiling:4,meaning:'Noticeable friction in important workflows.'},
      {value:'high',label:'High',ceiling:5,meaning:'Material bottleneck for commercial effectiveness.'},
    ]},
    {key:'effectiveness',label:'Sales effectiveness attributable to better data',why:'Record completeness alone is not a sale; the pilot must show a downstream change.',choices:[
      {value:'limited',label:'Limited',ceiling:2,meaning:'Little evidence of improved sales outcomes.'},
      {value:'moderate',label:'Moderate',ceiling:4,meaning:'Plausible improvement in relevant sales activity.'},
      {value:'significant',label:'Significant',ceiling:5,meaning:'Substantial attributable improvement is plausible.'},
      {value:'uncertain',label:'Uncertain',ceiling:3,meaning:'Downstream commercial effect is not yet clear.'},
    ]},reach,
  ]},
  pitch:{name:'GenAI Pitch Writer',fields:[
    {key:'effort',label:'Reduction in proposal preparation effort',why:'Compare drafting effort with the current process and account for review and rework.',choices:[
      {value:'limited',label:'Limited',ceiling:2,meaning:'Small net effort reduction.'},
      {value:'moderate',label:'Moderate',ceiling:4,meaning:'Meaningful net drafting effort released.'},
      {value:'significant',label:'Significant',ceiling:5,meaning:'Major sustained reduction in net preparation effort.'},
    ]},
    {key:'realization',label:'Turning saved time into profitable activity or savings',why:'Time saved is not automatically economic value; qualified demand or realizable savings must exist.',choices:[
      {value:'low',label:'Low',ceiling:2,meaning:'Little additional qualified work or cash saving.'},
      {value:'moderate',label:'Moderate',ceiling:4,meaning:'Some credible redeployment or realizable saving.'},
      {value:'high',label:'High',ceiling:5,meaning:'Strong credible value realization pathway.'},
      {value:'uncertain',label:'Uncertain',ceiling:3,meaning:'Value realization is not yet established.'},
    ]},reach,
  ]},
  generic:{name:'General business impact guide',fields:[
    {key:'scale',label:'Potential business scale',why:'How much important activity could be affected?',choices:[
      {value:'limited',label:'Limited',ceiling:2,meaning:'A bounded activity.'},
      {value:'regional',label:'Regional',ceiling:3,meaning:'A meaningful regional activity.'},
      {value:'multi',label:'Multi-regional',ceiling:4,meaning:'Important activity across several regions.'},
      {value:'global',label:'Broad global',ceiling:5,meaning:'Important activity across the group.'},
    ]},
    {key:'incremental',label:'Incremental improvement',why:'Judge improvement beyond the current process, not gross activity.',choices:[
      {value:'negligible',label:'Negligible',ceiling:1,meaning:'No meaningful change from current practice.'},
      {value:'small',label:'Small',ceiling:2,meaning:'A modest improvement.'},
      {value:'moderate',label:'Moderate',ceiling:4,meaning:'Meaningful improvement.'},
      {value:'significant',label:'Significant',ceiling:5,meaning:'Potentially major improvement.'},
    ]},
    {key:'realization',label:'Economic value realization',why:'Explain a plausible path to incremental Accor contribution.',choices:[
      {value:'low',label:'Low',ceiling:2,meaning:'Weak value pathway.'},
      {value:'moderate',label:'Moderate',ceiling:4,meaning:'Plausible pathway requiring validation.'},
      {value:'high',label:'High',ceiling:5,meaning:'Strong plausible pathway requiring validation.'},
      {value:'uncertain',label:'Uncertain',ceiling:3,meaning:'Economic pathway is not yet clear.'},
    ]},
  ]},
}
export type ImpactSuggestion={score:number|null;explanation:string;limiting:string[];missing:string[]}
export function suggestImpact(assessment:ImpactAssessment|undefined):ImpactSuggestion{
  if(!assessment || !Object.hasOwn(guides,assessment.guide))return {score:null,explanation:'No structured guide is available. Use the manual management rating.',limiting:[],missing:[]}
  const fields=guides[assessment.guide].fields
  const selected=fields.map(field=>({field,choice:field.choices.find(choice=>choice.value===assessment.assumptions?.[field.key]?.value)}))
  const missing=selected.filter(x=>!x.choice).map(x=>x.field.label)
  if(missing.length)return {score:null,explanation:`Select ${missing.join(', ')} to see a suggestion.`,limiting:[],missing}
  const score=Math.min(...selected.map(x=>x.choice!.ceiling))
  const limiting=selected.filter(x=>x.choice!.ceiling===score).map(x=>`${x.field.label}: ${x.choice!.label}`)
  return {score,limiting,missing:[],explanation:`Suggested ${score}/5. ${limiting.join('; ')} ${limiting.length===1?'sets':'set'} the highest defensible category in this guide. This is a structured qualitative recommendation, not proven ROI.`}
}
const validImpact=(n:number|null)=>n!==null&&Number.isInteger(n)&&n>=1&&n<=5
export function effectiveImpact(item:Initiative,key:ScenarioKey):number|null{
  const scenario=item.scenarios[key],assessment=scenario.impactAssessment
  if(!assessment)return scenario.impact
  const suggested=suggestImpact(assessment).score
  if(assessment.mode==='suggested')return suggested
  const confirmed=assessment.confirmedImpact
  if(!validImpact(confirmed))return null
  if((suggested===null||confirmed!==suggested)&&!assessment.confirmationRationale.trim())return null
  return confirmed
}
export function selectedAssumptions(assessment:ImpactAssessment|undefined){
  if(!assessment||!Object.hasOwn(guides,assessment.guide))return []
  return guides[assessment.guide].fields.map(field=>({field,label:field.choices.find(x=>x.value===assessment.assumptions?.[field.key]?.value)?.label??'Not selected',record:assessment.assumptions?.[field.key]}))
}
export function missingEvidence(assessment:ImpactAssessment|undefined){return selectedAssumptions(assessment).filter(x=>!x.record||x.record.source==='Unknown'||!x.record.pilotValidation.trim()).map(x=>x.field.label)}
const assumption=(value:string|null,source:EvidenceSource):ImpactAssumption=>({value,source,reference:'',rationale:source==='Expert judgment'?'Illustrative management assumption; unvalidated.':'',pilotValidation:source==='Expert judgment'?'Test with a measured baseline and credible comparison.':''})
export function newImpactAssessment(guide:ImpactGuide,values:Record<string,string|null>={},context:Partial<Pick<ImpactAssessment,'economicRationale'|'uncertainty'|'pilotValidation'>>={},source:EvidenceSource='Unknown'):ImpactAssessment{
  return {guide,mode:'suggested',assumptions:Object.fromEntries(guides[guide].fields.map(field=>[field.key,assumption(values[field.key]??null,source)])),confirmedImpact:null,confirmationRationale:'',economicRationale:context.economicRationale??'',uncertainty:context.uncertainty??'',pilotValidation:context.pilotValidation??''}
}
