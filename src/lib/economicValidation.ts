import type { EconomicValidation, Initiative, ScenarioKey } from '../types'

export const validationRubric = [
  'Very Low — Technical demonstration or anecdotal feedback; no credible economic evidence.',
  'Low — Operational improvements can be shown, but economic benefits remain largely assumed.',
  'Moderate — Business outcomes are measurable; financial conversion, attribution or scale remains uncertain.',
  'High — Incremental economic benefits can be credibly estimated with comparisons and financial assumptions.',
  'Very High — Robust evidence supports a scale, improve or stop decision with defensible attribution and rollout assumptions.',
] as const

export const blankEconomicValidation = (): EconomicValidation => ({
  rating:null,rationale:'',economicBenefit:'',businessKpi:'',financialTranslation:'',minimumImprovement:'',
  baseline:'',evaluationDesign:'',externalFactors:'',incrementalValue:'',scaleCosts:'',remainingFinancialUncertainty:'',
  representativePopulation:'',extrapolationLimits:'',decisionUse:'',criticalHypothesis:'',valueMechanism:'',
  measurableOutcome:'',pilotMethod:'',decisionThreshold:'',mainUncertainty:'',evidenceLimitations:'',
})

export const validationRating = (item: Initiative, key: ScenarioKey): number | null => {
  const assessment = item.scenarios[key].economicValidation
  return assessment && Number.isInteger(assessment.rating) && assessment.rating! >= 1 && assessment.rating! <= 5 && assessment.rationale.trim() ? assessment.rating : null
}

export function normalizeEconomicValidation(value: unknown): EconomicValidation {
  const source = value && typeof value === 'object' ? value as Partial<EconomicValidation> : {}
  const result = blankEconomicValidation()
  for (const key of Object.keys(result) as (keyof EconomicValidation)[]) {
    if (key === 'rating') continue
    result[key] = typeof source[key] === 'string' ? source[key] : ''
  }
  result.rating = Number.isInteger(source.rating) && (source.rating as number) >= 1 && (source.rating as number) <= 5 ? source.rating as number : null
  return result
}
