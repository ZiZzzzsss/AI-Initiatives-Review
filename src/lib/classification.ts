import type { Initiative } from '../types'

// Keep the simulator's geography and function vocabulary in one place.
export const REGION_GROUPS = [
  { name: 'Europe & North Africa', subregions: ['Europe', 'North Africa'] },
  { name: 'Middle East, Africa & Asia Pacific', subregions: ['Middle East', 'Sub-Saharan Africa', 'Greater China', 'Asia & Pacific'] },
  { name: 'Americas', subregions: ['North America', 'Latin America'] },
] as const
export const BUSINESS_FUNCTIONS = ['Sales', 'Revenue Management', 'Business Performance'] as const
export const REGION_SCOPES = ['Global', 'Cross-regional'] as const
export const ALL_REGIONS = 'All Regions'
export const ALL_FUNCTIONS = 'All Functions'

const LEGACY_FUNCTIONS: Record<string, string> = {
  'Sales Operations': 'Sales',
  Pricing: 'Revenue Management',
}

export function groupForRegion(value: string) {
  return REGION_GROUPS.find(group => group.name === value || group.subregions.some(subregion => subregion === value))
}

export function isStandardRegion(value: string) {
  return REGION_GROUPS.some(group => group.name === value) || REGION_SCOPES.some(scope => scope === value)
}

export function isStandardFunction(value: string) {
  return BUSINESS_FUNCTIONS.some(fn => fn === value)
}

export function normalizeClassification(item: Initiative): Initiative {
  const group = groupForRegion(item.region)
  const legacySubregion = group && item.region !== group.name ? item.region : ''
  const subregion = typeof item.subregion === 'string' ? item.subregion : ''
  const coveredRegions = Array.isArray(item.coveredRegions)
    ? [...new Set(item.coveredRegions.filter((region): region is string => typeof region === 'string'))]
    : []
  return {
    ...item,
    region: group?.name || item.region,
    subregion: subregion || legacySubregion,
    coveredRegions,
    function: LEGACY_FUNCTIONS[item.function] || item.function,
  }
}

export function matchesRegion(item: Initiative, selected: string) {
  if (selected === ALL_REGIONS) return true
  if (selected === 'Global' || selected === 'Cross-regional') return item.region === selected
  const group = groupForRegion(selected)
  if (!group) return item.region === selected
  if (item.region === 'Global') return true
  if (selected !== group.name) return item.subregion === selected
  return item.region === group.name || (item.region === 'Cross-regional' && item.coveredRegions.includes(group.name))
}

export function matchesFunction(item: Initiative, selected: string) {
  return selected === ALL_FUNCTIONS || item.function === selected
}

export function regionLabel(item: Initiative) {
  if (item.region === 'Cross-regional') return item.coveredRegions.length ? `Cross-regional · ${item.coveredRegions.join(', ')}` : 'Cross-regional · coverage to define'
  return item.subregion ? `${item.region} · ${item.subregion}` : item.region || 'Region unspecified'
}

export function functionLabel(item: Initiative) {
  return !item.function ? 'Function unspecified' : isStandardFunction(item.function) ? item.function : `${item.function} · needs review`
}
