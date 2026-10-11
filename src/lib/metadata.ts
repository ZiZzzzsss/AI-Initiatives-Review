import type { Archetype, CostKey, Descriptor, Urgency } from '../types'
export const archetypes: { name: Archetype; description: string; example: string }[] = [
  { name: 'Productivity Accelerator', description: 'Expands capacity, throughput, or efficiency.', example: 'Proposal drafting' },
  { name: 'Sales Growth Accelerator', description: 'Improves opportunity creation or conversion.', example: 'Lead qualification' },
  { name: 'Revenue & Margin Optimizer', description: 'Improves yield from existing commercial activity.', example: 'Pricing optimization' },
  { name: 'Customer Value Protector', description: 'Improves retention, loyalty, or experience.', example: 'Service recovery' },
  { name: 'Strategic Enabler', description: 'Builds capabilities other initiatives need.', example: 'Trusted customer data' },
  { name: 'Workflow Transformer', description: 'Redesigns an end-to-end process.', example: 'Automated intake-to-resolution' },
  { name: 'New Growth Innovator', description: 'Creates new services, markets, or models.', example: 'New guest service' },
  { name: 'Risk & Resilience Safeguard', description: 'Reduces material operating or compliance risk.', example: 'Fraud detection' },
]
export const descriptors: Descriptor[] = ['Quick Win', 'High-Impact Opportunity', 'Critical Fix', 'Long-Horizon Opportunity', 'Exploratory Initiative']
export const urgencyColors: Record<Urgency, string> = { Low: '#40966e', Moderate: '#dfb542', High: '#e88b45', Critical: '#cb5a5a' }
export const impactLabels = ['','Very Limited','Limited','Moderate','High','Very High']
export const impactRubric = [
  'Marginal improvement in a narrowly scoped activity.',
  'Noticeable but restricted improvement.',
  'Meaningful improvement in a business process or function.',
  'Major improvement in an important activity with substantial reach or operational significance.',
  'Potentially transformative improvement in an important capability or operating model.',
]
export const costLabels: Record<CostKey, string> = { development: 'Development / configuration', integration: 'Technical integration', data: 'Data preparation', software: 'Software licenses / usage', internalTeam: 'Internal project team', testing: 'Business-user testing', training: 'Training / change', evaluation: 'Evaluation / monitoring', other: 'Other', contingency: 'Contingency' }
export const feasibilityLabels = ['Business owner identified','Technical integration feasible','Required data available','Privacy and compliance reviewed','Operational capacity sufficient','Pilot users available','Funding or budget approved','Evaluation approach identified']
export const evidenceLabels = ['Baseline KPI available','Credible comparison available','Key outcomes measurable','Attribution plausible','Evaluation period sufficient']
