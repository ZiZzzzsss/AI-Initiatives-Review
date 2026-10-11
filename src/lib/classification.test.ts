import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Initiative } from '../types'
import { demoPortfolio } from './data'
import { ALL_FUNCTIONS, ALL_REGIONS, BUSINESS_FUNCTIONS, functionLabel, matchesFunction, matchesRegion, normalizeClassification, REGION_GROUPS } from './classification'
import { loadWorkspace, parseImport, saveWorkspace } from './storage'

describe('region and business function classifications', () => {
  it('uses the three requested business functions and demo assignments', () => {
    expect(BUSINESS_FUNCTIONS).toEqual(['Sales', 'Revenue Management', 'Business Performance'])
    const [pitch, crm, pricing] = demoPortfolio().initiatives
    expect([pitch.function, crm.function, pricing.function]).toEqual(['Sales', 'Sales', 'Revenue Management'])
    expect([pitch.region, crm.region, pricing.region]).toEqual(['Europe & North Africa', 'Europe & North Africa', 'Global'])
    expect([pitch.subregion, crm.subregion]).toEqual(['Europe', 'Europe'])
  })

  it('migrates recognized legacy values without losing subregion detail', () => {
    const legacy = demoPortfolio().initiatives[1]
    legacy.region = 'Europe'
    legacy.function = 'Sales Operations'
    delete (legacy as Partial<Initiative>).subregion
    delete (legacy as Partial<Initiative>).coveredRegions
    const migrated = normalizeClassification(legacy)
    expect([migrated.region, migrated.subregion, migrated.function]).toEqual(['Europe & North Africa', 'Europe', 'Sales'])
    expect(migrated.coveredRegions).toEqual([])
    expect(normalizeClassification(migrated)).toEqual(migrated)
    expect(normalizeClassification({...legacy,function:'Pricing'}).function).toBe('Revenue Management')
  })

  it('preserves unmapped legacy values visibly for review', () => {
    const legacy = {...demoPortfolio().initiatives[0],region:'EMEA legacy',function:'Hotel Operations'}
    const migrated = normalizeClassification(legacy)
    expect(migrated.region).toBe('EMEA legacy')
    expect(functionLabel(migrated)).toBe('Hotel Operations · needs review')
    expect(matchesRegion(migrated,'EMEA legacy')).toBe(true)
    expect(matchesFunction(migrated,'Hotel Operations')).toBe(true)
  })

  it('filters main regions, subregions, Global, and explicit cross-regional coverage', () => {
    const [europe,,global] = demoPortfolio().initiatives
    const cross = {...europe,region:'Cross-regional',subregion:'',coveredRegions:[REGION_GROUPS[0].name,REGION_GROUPS[2].name]}
    expect(matchesRegion(europe,ALL_REGIONS)).toBe(true)
    expect(matchesRegion(europe,'Europe & North Africa')).toBe(true)
    expect(matchesRegion(europe,'Europe')).toBe(true)
    expect(matchesRegion(europe,'North Africa')).toBe(false)
    expect(matchesRegion(global,'Americas')).toBe(true)
    expect(matchesRegion(cross,'Americas')).toBe(true)
    expect(matchesRegion(cross,'Middle East, Africa & Asia Pacific')).toBe(false)
    expect(matchesRegion(cross,'Europe')).toBe(false)
    expect(matchesRegion(cross,'Cross-regional')).toBe(true)
  })

  it('combines region, function, and archetype filters', () => {
    const items = demoPortfolio().initiatives
    const result = items.filter(item => matchesRegion(item,'Europe & North Africa') && matchesFunction(item,'Sales') && item.archetype === 'Strategic Enabler')
    expect(result.map(item=>item.name)).toEqual(['Automated CRM Data Enrichment'])
    expect(items.filter(item=>matchesFunction(item,'Business Performance'))).toEqual([])
    expect(items.every(item=>matchesFunction(item,ALL_FUNCTIONS))).toBe(true)
  })
})

describe('classification persistence', () => {
  const memory = new Map<string,string>()
  beforeEach(() => {
    memory.clear()
    vi.stubGlobal('localStorage',{
      getItem:(key:string)=>memory.get(key)??null,
      setItem:(key:string,value:string)=>{memory.set(key,value)},
      removeItem:(key:string)=>{memory.delete(key)},
    })
  })

  it('migrates a saved legacy workspace and retains other data through save and reload', () => {
    const portfolio = demoPortfolio()
    const originalMonths = portfolio.initiatives[1].scenarios.optimistic.months
    portfolio.initiatives[1].region = 'Europe'
    portfolio.initiatives[1].function = 'Sales Operations'
    delete (portfolio.initiatives[1] as Partial<Initiative>).subregion
    portfolio.initiatives[2].function = 'Unmapped commercial role'
    memory.set('ai-portfolio-explorer:workspace-v1',JSON.stringify({portfolios:[portfolio],activeId:portfolio.id}))
    const migrated = loadWorkspace()
    expect(migrated.portfolios[0].initiatives[1]).toMatchObject({region:'Europe & North Africa',subregion:'Europe',function:'Sales'})
    expect(migrated.portfolios[0].initiatives[1].scenarios.optimistic.months).toBe(originalMonths)
    expect(migrated.portfolios[0].initiatives[2].function).toBe('Unmapped commercial role')
    saveWorkspace(migrated)
    expect(loadWorkspace()).toEqual(migrated)
    expect(parseImport(JSON.stringify(portfolio)).initiatives[1].subregion).toBe('Europe')
  })

  it('persists a new cross-regional classification and primary function', () => {
    const portfolio = demoPortfolio()
    portfolio.initiatives[0] = {
      ...portfolio.initiatives[0],
      region: 'Cross-regional',
      subregion: '',
      coveredRegions: ['Europe & North Africa', 'Americas'],
      function: 'Business Performance',
    }
    const workspace = {portfolios:[portfolio],activeId:portfolio.id}
    saveWorkspace(workspace)
    expect(loadWorkspace()).toEqual(workspace)
    expect(matchesRegion(loadWorkspace().portfolios[0].initiatives[0],'Americas')).toBe(true)
  })
})
