import type { Initiative, Portfolio, ScenarioKey } from '../types'
import { demoPortfolio } from './data'
import { pilotTotal, readiness } from './assessment'
import { normalizeClassification } from './classification'
import { normalizeDelivery } from './delivery'
const KEY='ai-portfolio-explorer:v1'
const WORKSPACE_KEY='ai-portfolio-explorer:workspace-v1'
export type SavedWorkspace={portfolios:Portfolio[];activeId:string}
export function validatePortfolio(value:unknown):value is Portfolio {
  if (!value || typeof value!=='object') return false
  const p=value as Portfolio
  return typeof p.id==='string' && typeof p.name==='string' && Array.isArray(p.initiatives) && p.initiatives.every(i=>
    i && typeof i.id==='string' && typeof i.name==='string' && typeof i.region==='string' && typeof i.businessUnit==='string' && typeof i.function==='string' && typeof i.archived==='boolean' && Array.isArray(i.secondary) && i.urgencyInputs && i.phases && i.scenarios && ['conservative','base','optimistic'].every(k=> {
      const s=i.scenarios[k as ScenarioKey]
      return s && (s.impact===null || typeof s.impact==='number') && (s.months===null || typeof s.months==='number') && (s.pilotCost===null || typeof s.pilotCost==='number') && (s.urgency===null || ['Low','Moderate','High','Critical'].includes(s.urgency)) && ['simple','advanced'].includes(s.costMode) && s.costs && typeof s.costs==='object' && ['development','integration','data','software','internalTeam','testing','training','evaluation','other','contingency'].every(c=>typeof s.costs[c as keyof typeof s.costs]==='number') && typeof s.assumptions==='string'
    }) && i.feasibility && typeof i.feasibility==='object' && i.evidence && typeof i.evidence==='object')
}
export function migratePortfolio(portfolio:Portfolio):Portfolio {
  const examples=portfolio.id==='demo'?demoPortfolio().initiatives:[]
  return {...portfolio,initiatives:portfolio.initiatives.map(i=>{
    const example=examples.find(seed=>seed.name===i.name&&seed.archetype===i.archetype&&(['conservative','base','optimistic'] as const).every(key=>{
      const saved=i.scenarios[key],original=seed.scenarios[key]
      return saved.impact===original.impact&&saved.months===original.months&&saved.pilotCost===original.pilotCost&&saved.urgency===original.urgency
    }))
    const classified=normalizeClassification(i)
    if(!example||i.deliveryAssessmentVersion===1)return {...normalizeDelivery(classified),deliveryAssessmentVersion:1}
    return normalizeDelivery({...classified,
      deliveryAssessment:example.deliveryAssessment,deliveryAssessmentVersion:1,
      scenarios:Object.fromEntries((['conservative','base','optimistic'] as const).map(key=>[key,{...i.scenarios[key],timeline:example.scenarios[key].timeline}])) as Initiative['scenarios'],
    })
  })}
}
export function loadPortfolio():Portfolio {
  try { const raw=localStorage.getItem(KEY); if(raw){const parsed=JSON.parse(raw);if(validatePortfolio(parsed))return migratePortfolio(parsed)} } catch { /* recover with demo */ }
  return demoPortfolio()
}
export function savePortfolio(p:Portfolio){localStorage.setItem(KEY,JSON.stringify(p))}
export function resetPortfolio():Portfolio{const p=demoPortfolio();savePortfolio(p);return p}
export function loadWorkspace():SavedWorkspace{
  try{const raw=localStorage.getItem(WORKSPACE_KEY);if(raw){const w=JSON.parse(raw) as SavedWorkspace;if(Array.isArray(w.portfolios)&&w.portfolios.length&&w.portfolios.every(validatePortfolio)&&typeof w.activeId==='string')return {...w,portfolios:w.portfolios.map(migratePortfolio)}}}catch{/* recover */}
  const p=loadPortfolio();return {portfolios:[p],activeId:p.id}
}
export function saveWorkspace(w:SavedWorkspace){localStorage.setItem(WORKSPACE_KEY,JSON.stringify(w))}
export function resetWorkspace():SavedWorkspace{const p=demoPortfolio();const w={portfolios:[p],activeId:p.id};saveWorkspace(w);return w}
export function parseImport(raw:string):Portfolio {const value=JSON.parse(raw);if(!validatePortfolio(value))throw new Error('This file is not a valid portfolio export.');return migratePortfolio(value)}
export function download(name:string,content:string,type:string){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function exportJson(p:Portfolio){download('ai-initiative-portfolio.json',JSON.stringify(p,null,2),'application/json')}
const csvCell=(x:unknown)=>`"${String(x??'').replaceAll('"','""')}"`
export function exportCsv(p:Portfolio,key:ScenarioKey){const columns=['Initiative','Region / scope','Subregion','Covered regions','Business unit','Business function','Archetype','Impact (1–5)','Months to value','Pilot investment EUR','Urgency','Readiness','Scenario','Assumptions'];const rows=p.initiatives.filter(i=>!i.archived).map(i=>{const s=i.scenarios[key];return [i.name,i.region,i.subregion,i.coveredRegions.join('; '),i.businessUnit,i.function,i.archetype,s.impact,s.months,pilotTotal(s),s.urgency,readiness(i),key,s.assumptions].map(csvCell).join(',')});download(`portfolio-${key}.csv`,[columns.map(csvCell).join(','),...rows].join('\r\n'),'text/csv;charset=utf-8')}
