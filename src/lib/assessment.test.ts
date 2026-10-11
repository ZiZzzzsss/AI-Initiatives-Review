import { describe, expect, it, beforeEach, vi } from 'vitest'
import { bubbleRadius, compareSummary, isComplete, pilotTotal, readiness, suggestDescriptor, suggestUrgency, validImpact, validMonths, yPosition } from './assessment'
import { blankInitiative, cloneInitiative, demoPortfolio } from './data'
import { deleteInitiative, upsertInitiative } from './portfolio'
import { loadWorkspace, parseImport, resetWorkspace, saveWorkspace, validatePortfolio } from './storage'

describe('management assessments',()=>{
  it('accepts only whole impact categories 1–5',()=>{expect([1,2,3,4,5].every(validImpact)).toBe(true);expect([0,6,2.5,null,NaN].some(validImpact)).toBe(false)})
  it('keeps missing, zero, and invalid chart inputs distinct',()=>{const i=blankInitiative();i.name='Test';i.archetype='Productivity Accelerator';const s=i.scenarios.base;s.impact=3;s.months=0;s.pilotCost=0;s.urgency='Low';expect(isComplete(i,'base')).toBe(true);s.months=null;expect(isComplete(i,'base')).toBe(false);expect(validMonths(-1)).toBe(false)})
  it('isolates scenario assumptions and chart changes',()=>{const i=demoPortfolio().initiatives[0];const before=i.scenarios.base.months;i.scenarios.conservative.months=11;expect(i.scenarios.base.months).toBe(before);expect(i.scenarios.optimistic.months).not.toBe(11)})
  it('sums detailed pilot costs without adding the direct total',()=>{const s=blankInitiative().scenarios.base;s.pilotCost=99999;s.costMode='advanced';s.costs.development=10000;s.costs.internalTeam=5000;expect(pilotTotal(s)).toBe(15000);s.costMode='simple';expect(pilotTotal(s)).toBe(99999)})
  it('scales circle area with pilot investment above the visibility floor',()=>{const a=bubbleRadius(50000,200000),b=bubbleRadius(200000,200000);expect((b*b)/(a*a)).toBeCloseTo(4,5)})
  it('puts shorter time higher',()=>{expect(yPosition(3,0,18,400)).toBeLessThan(yPosition(10,0,18,400))})
  it('keeps suggested and confirmed urgency distinct',()=>{const i=blankInitiative();i.urgencyInputs.severity='High';i.urgencyInputs.workaround='Temporary process';i.urgencyInputs.workaroundEffectiveness='High';i.scenarios.base.urgency='Critical';i.scenarios.base.urgencyRationale='Override: committed seasonal deadline';expect(suggestUrgency(i).level).toBe('Moderate');expect(i.scenarios.base.urgency).toBe('Critical');expect(i.scenarios.base.urgencyRationale).toContain('Override')})
  it('suggests a descriptor without changing the confirmed choice',()=>{const i=demoPortfolio().initiatives[2];i.descriptor=null;expect(suggestDescriptor(i)?.name).toBe('High-Impact Opportunity');expect(i.descriptor).toBeNull()})
  it('flags blocked feasibility separately from impact',()=>{const i=demoPortfolio().initiatives[0];i.feasibility['Required data available']='Blocked';expect(readiness(i)).toBe('Blocked');expect(i.scenarios.base.impact).toBe(3)})
  it('compares trade-offs without selecting a winner',()=>{const p=demoPortfolio();const text=compareSummary([p.initiatives[0],p.initiatives[2]],'base');expect(text).toContain('higher assessed impact');expect(text).toContain('reaches meaningful value sooner');expect(text).toContain('preferred investment depends')})
})
describe('portfolio lifecycle',()=>{
  const memory=new Map<string,string>()
  beforeEach(()=>{memory.clear();vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v)},removeItem:(k:string)=>memory.delete(k)})})
  it('round-trips a JSON export and rejects malformed input',()=>{const p=demoPortfolio();expect(validatePortfolio(JSON.parse(JSON.stringify(p)))).toBe(true);expect(parseImport(JSON.stringify(p)).initiatives).toHaveLength(3);expect(()=>parseImport('{"initiatives":[]}')).toThrow()})
  it('persists and resets the illustrative portfolio',()=>{const w=resetWorkspace();w.portfolios[0].name='Edited';saveWorkspace(w);expect(loadWorkspace().portfolios[0].name).toBe('Edited');expect(resetWorkspace().portfolios[0].initiatives).toHaveLength(3)})
  it('duplicates, edits, and deletes without mutating the source',()=>{let p=demoPortfolio();const source=p.initiatives[0];const copy=cloneInitiative(source);expect(copy.id).not.toBe(source.id);p=upsertInitiative(p,copy);expect(p.initiatives).toHaveLength(4);p=upsertInitiative(p,{...copy,name:'Edited copy'});expect(p.initiatives.find(i=>i.id===copy.id)?.name).toBe('Edited copy');p=deleteInitiative(p,copy.id);expect(p.initiatives).toHaveLength(3);expect(source.name).toBe('GenAI Pitch Writer')})
})
