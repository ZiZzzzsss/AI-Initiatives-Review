import type { ImpactAssessment, ImpactGuide, Initiative, ScenarioKey } from '../types'
import { guides, selectedAssumptions, suggestImpact } from './impactGuide'

type RationaleGuide = {
  priority: string
  weakerValue: string
  criticalQuestion: string
  sensitivitySubject: string
  shortLabels: Record<string, string>
  evidenceGaps: readonly string[]
  pilotChecks: readonly string[]
  fieldChecks: Record<string, string>
  weakHypothesis: string
  downside: string
}

export const rationaleGuides: Record<ImpactGuide, RationaleGuide> = {
  pricing: {
    priority: 'incremental', weakerValue: 'negligible',
    criticalQuestion: 'Will AI pricing meaningfully outperform existing revenue management?',
    sensitivitySubject: 'incremental pricing improvement',
    shortLabels: { incremental: 'Incremental pricing improvement', reach: 'Deployment reach', capture: 'Accor value capture' },
    evidenceGaps: ['Current pricing tools and their effectiveness', 'Eligible hotels and realistic deployment coverage', 'Incremental performance versus existing practice', 'How hotel-level gains become Accor contribution'],
    pilotChecks: ['Establish the current pricing-performance baseline and credible control properties.', 'Measure incremental RevPAR or contribution margin, accounting for seasonality and property differences.', 'Validate Accor’s value-capture mechanism with Finance.'],
    fieldChecks: { incremental: 'Compare incremental pricing performance with current systems using credible control properties.', reach: 'Count eligible hotels and test whether deployment is feasible in the selected markets.', capture: 'Trace measured hotel-level gains to incremental contribution captured by Accor with Finance.' },
    weakHypothesis: 'The proposed tool does not materially outperform existing revenue management.',
    downside: 'The incremental pricing case weakens; revisit its priority, especially its time to value and pilot investment.',
  },
  crm: {
    priority: 'effectiveness', weakerValue: 'limited',
    criticalQuestion: 'Will better CRM data materially improve sales effectiveness?',
    sensitivitySubject: 'sales effectiveness improvement',
    shortLabels: { bottleneck: 'Commercial data bottleneck', effectiveness: 'Sales effectiveness improvement', reach: 'Deployment reach' },
    evidenceGaps: ['Baseline CRM accuracy, completeness and duplicates', 'Whether poor data constrains commercial performance', 'Sales-team use of enriched information', 'Downstream changes in qualified opportunities or conversion', 'Comparable workflows across regions'],
    pilotChecks: ['Measure record quality and sales-team use before and after enrichment.', 'Track research effort, account coverage and follow-up activity.', 'Compare qualified opportunities or conversion with a credible baseline when feasible; completeness alone is not proof of sales.'],
    fieldChecks: { bottleneck: 'Measure whether baseline data defects actually restrict commercial workflows.', effectiveness: 'Compare downstream commercial activity and outcomes with a credible baseline.', reach: 'Test data availability, stewardship and workflow comparability across the proposed regions.' },
    weakHypothesis: 'Better data does not materially improve commercial effectiveness.',
    downside: 'The commercial value case weakens. Operational value or a verified future dependency may remain, but a hypothetical dependency does not raise this impact rating.',
  },
  pitch: {
    priority: 'realization', weakerValue: 'low',
    criticalQuestion: 'Can saved time create profitable activity or realizable savings?',
    sensitivitySubject: 'economic value realization',
    shortLabels: { effort: 'Proposal time savings', realization: 'Economic value realization', reach: 'Deployment reach' },
    evidenceGaps: ['Current end-to-end drafting and review effort', 'Net time saved after quality checks and rework', 'Proposal quality and brand compliance', 'Qualified demand for released sales capacity', 'Actual profitable activity or realizable savings'],
    pilotChecks: ['Compare end-to-end drafting and review time with current practice.', 'Measure quality, accuracy, rework and time spent verifying AI content.', 'Track additional qualified client activity and whether it creates business or realizable savings.'],
    fieldChecks: { effort: 'Measure net drafting and review time, including quality checks and rework.', realization: 'Track whether released capacity serves qualified demand or creates realizable savings.', reach: 'Count eligible sales teams and test adoption across the proposed footprint.' },
    weakHypothesis: 'Saved time does not become additional profitable activity or realizable savings.',
    downside: 'The economic impact case weakens, though a shorter, lower-investment pilot may still be useful for gathering operational evidence.',
  },
  generic: {
    priority: 'realization', weakerValue: 'low',
    criticalQuestion: 'Will the improvement create realizable economic contribution?',
    sensitivitySubject: 'economic value realization',
    shortLabels: { scale: 'Business scale', incremental: 'Incremental improvement', realization: 'Economic value realization' },
    evidenceGaps: ['Baseline activity and current process performance', 'The eligible deployment scope', 'Incremental contribution attributable to the change'],
    pilotChecks: ['Establish a baseline and credible comparison.', 'Measure the incremental improvement and eligible reach.', 'Test whether the improvement creates realizable economic contribution.'],
    fieldChecks: { scale: 'Measure the eligible activity and deployment footprint.', incremental: 'Compare the new process with current performance.', realization: 'Trace the measured improvement to realizable economic contribution.' },
    weakHypothesis: 'The improvement does not create realizable incremental economic contribution.',
    downside: 'Revisit the impact case and compare the pilot with other opportunities using time, cost, urgency and feasibility.',
  },
}

export function counterfactualImpact(assessment: ImpactAssessment, fieldKey: string, alternativeValue: string) {
  const field = guides[assessment.guide].fields.find(x => x.key === fieldKey)
  if (!field || !field.choices.some(x => x.value === alternativeValue)) return suggestImpact(assessment)
  const preview: ImpactAssessment = {
    ...assessment,
    assumptions: {
      ...assessment.assumptions,
      [fieldKey]: { ...assessment.assumptions[fieldKey], value: alternativeValue },
    },
  }
  return suggestImpact(preview)
}

export function defaultCounterfactual(assessment: ImpactAssessment, fieldKey: string): string {
  const field = guides[assessment.guide].fields.find(x => x.key === fieldKey)
  if (!field) return ''
  const current = field.choices.find(x => x.value === assessment.assumptions[fieldKey]?.value)
  const preferred = fieldKey === rationaleGuides[assessment.guide].priority ? rationaleGuides[assessment.guide].weakerValue : ''
  const preferredChoice = field.choices.find(x => x.value === preferred)
  if (preferredChoice && current && preferredChoice.ceiling < current.ceiling) return preferred
  const weaker = field.choices.filter(x => !current || x.ceiling < current.ceiling).sort((a, b) => a.ceiling - b.ceiling)[0]
  const stronger = field.choices.filter(x => current && x.ceiling > current.ceiling).sort((a, b) => a.ceiling - b.ceiling)[0]
  return weaker?.value ?? stronger?.value ?? current?.value ?? field.choices[0].value
}

const label = (assessment: ImpactAssessment, key: string) => selectedAssumptions(assessment).find(x => x.field.key === key)?.label.toLowerCase() ?? 'unassessed'
const scoreName = (score: number | null) => score === null ? 'unassessed' : score >= 4 ? 'high' : score === 3 ? 'moderate' : 'limited'

export function executiveWhy(assessment: ImpactAssessment): string {
  const score = suggestImpact(assessment).score
  if (score === null) return 'Select the three business assumptions to explain the potential improvement and its economic value.'
  const impact = scoreName(score)
  const binding = selectedAssumptions(assessment).filter(x => x.field.choices.find(choice => choice.value === x.record?.value)?.ceiling === score).map(x => `${rationaleGuides[assessment.guide].shortLabels[x.field.key]} (${x.label})`).join(' and ')
  switch (assessment.guide) {
    case 'pricing': return score <= 2
      ? `Pricing may improve hotel revenue, but ${binding} limits incremental economic potential beyond existing systems.`
      : `Better pricing decisions could create ${impact} revenue and margin potential across ${label(assessment, 'reach')} deployment, provided they outperform current systems and Accor captures part of the additional value.`
    case 'crm': return score <= 2
      ? `Better account data may reduce manual work, but ${binding} limits the commercial value that improved records could generate.`
      : `Better account data could support ${impact} sales effectiveness potential across ${label(assessment, 'reach')} deployment, if poor data is a ${label(assessment, 'bottleneck')} commercial bottleneck and improved records change sales outcomes.`
    case 'pitch': return score <= 2
      ? `Faster proposals may release capacity, but ${binding} limits the potential for profitable activity or realizable savings.`
      : `Faster proposal preparation could create ${impact} capacity value across ${label(assessment, 'reach')} deployment. Economic benefit depends on turning saved time into profitable activity or realizable savings.`
    default: return `A ${label(assessment, 'incremental')} improvement across ${label(assessment, 'scale')} business scale could create ${impact} impact if ${label(assessment, 'realization')} economic value realization is achieved.`
  }
}

export function executiveSensitivity(assessment: ImpactAssessment): { question: string; explanation: string; alternative: string; alternativeScore: number | null } {
  const guide = rationaleGuides[assessment.guide]
  const field = guides[assessment.guide].fields.find(x => x.key === guide.priority)!
  const alternative = defaultCounterfactual(assessment, field.key)
  const alternativeLabel = field.choices.find(x => x.value === alternative)?.label ?? 'unknown'
  const currentScore = suggestImpact(assessment).score
  const alternativeScore = counterfactualImpact(assessment, field.key, alternative).score
  const movement = currentScore === null || alternativeScore === null ? 'cannot yet be calculated' : alternativeScore < currentScore ? `falls from ${currentScore}/5 to ${alternativeScore}/5` : alternativeScore > currentScore ? `rises from ${currentScore}/5 to ${alternativeScore}/5` : `stays at ${currentScore}/5 because another assumption remains limiting`
  return { question: guide.criticalQuestion, explanation: `If ${guide.sensitivitySubject} is ${alternativeLabel}, suggested impact ${movement}.`, alternative, alternativeScore }
}

export function executiveEvidence(assessment: ImpactAssessment): string {
  const records = selectedAssumptions(assessment).map(x => x.record)
  const observed = records.filter(x => x?.source === 'Observed').length
  if (observed === 3) return 'Observed sources recorded · Validate attribution'
  if (observed > 0) return `${observed}/3 observed sources · More evidence to validate`
  return 'Illustrative assessment · Evidence to validate'
}

export function impactWhy(assessment: ImpactAssessment): string {
  const score = suggestImpact(assessment).score
  const verdict = score === null ? 'Complete the three assumptions to see a suggested impact.' : `Together, these assumptions suggest ${scoreName(score)} potential Business Impact (${score}/5).`
  switch (assessment.guide) {
    case 'pricing': return `Pricing decisions affect recurring hotel revenue, but only gains beyond existing revenue management count. The case assumes ${label(assessment, 'incremental')} incremental improvement, ${label(assessment, 'reach')} deployment reach and ${label(assessment, 'capture')} capture of hotel-level gains by Accor. ${verdict}`
    case 'crm': return `Incomplete CRM data can hinder sales targeting and create manual work. The case assumes a ${label(assessment, 'bottleneck')} commercial bottleneck, ${label(assessment, 'effectiveness')} improvement in sales effectiveness attributable to better data and ${label(assessment, 'reach')} deployment reach; cleaner records alone do not prove economic value. ${verdict}`
    case 'pitch': return `Proposal preparation consumes sales capacity. The case assumes ${label(assessment, 'effort')} reduction in net drafting effort, ${label(assessment, 'realization')} conversion of saved time into profitable activity or realizable savings and ${label(assessment, 'reach')} deployment reach. ${verdict}`
    default: return `The case combines ${label(assessment, 'scale')} business scale, ${label(assessment, 'incremental')} incremental improvement and ${label(assessment, 'realization')} economic value realization. ${verdict}`
  }
}

export function impactDecision(item: Initiative, scenario: ScenarioKey, alternativeScore: number | null, peers: Initiative[] = [], changed = true): string {
  const assessment = item.scenarios[scenario].impactAssessment
  if (!assessment) return 'Discuss impact alongside economic validation, evidence timing, pilot investment and feasibility.'
  const current = suggestImpact(assessment).score
  const guide = rationaleGuides[assessment.guide]
  const comparison = peers.filter(x => x.id !== item.id && !x.archived).slice(0, 3).map(x => x.name).join(' and ')
  const compare = comparison ? ` Compare with ${comparison}` : ' Compare with other opportunities'
  const dimensions = ' using economic validation, evidence timing, pilot investment and feasibility; this preview does not decide the pilot.'
  if (current === null || alternativeScore === null) return `Complete the assumptions before drawing a priority implication.${compare}${dimensions}`
  if (!changed) return `This preview leaves the assumption and suggested rating unchanged.${compare}${dimensions}`
  if (alternativeScore < current) return `${guide.downside}${compare}${dimensions}`
  if (alternativeScore === current) return `The suggested rating stays at ${current}/5 because another assumption still limits it. The tested assumption may still matter to the pilot.${compare}${dimensions}`
  return `The stronger assumption raises the suggested impact to ${alternativeScore}/5, subject to pilot validation.${compare}${dimensions}`
}
