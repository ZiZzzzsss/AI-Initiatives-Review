export type ScenarioKey = 'conservative' | 'base' | 'optimistic'
export type Urgency = 'Low' | 'Moderate' | 'High' | 'Critical'
export type CheckState = 'Confirmed' | 'Unconfirmed' | 'Blocked' | 'Not Applicable'
export type EvidenceSource = 'Observed' | 'External benchmark' | 'Expert judgment' | 'Unknown'
export type Archetype = 'Productivity Accelerator' | 'Sales Growth Accelerator' | 'Revenue & Margin Optimizer' | 'Customer Value Protector' | 'Strategic Enabler' | 'Workflow Transformer' | 'New Growth Innovator' | 'Risk & Resilience Safeguard'
export type Descriptor = 'Quick Win' | 'High-Impact Opportunity' | 'Critical Fix' | 'Long-Horizon Opportunity' | 'Exploratory Initiative'
export type CostKey = 'development' | 'integration' | 'data' | 'software' | 'internalTeam' | 'testing' | 'training' | 'evaluation' | 'other' | 'contingency'
export type DataReadiness = 'Ready' | 'Partially Ready' | 'Not Ready' | 'Unknown'
export type DeliveryComplexity = 'Low' | 'Medium' | 'High' | 'Very High'
export type EvidenceMeasurability = DeliveryComplexity | 'Unknown'
export type DeliveryAssessment = {
  dataReadiness: { status: DataReadiness | null; sources: string; explanation: string }
  technicalComplexity: { rating: DeliveryComplexity | null; explanation: string }
  implementationComplexity: { rating: DeliveryComplexity | null; explanation: string }
  evidenceMeasurability: { rating: EvidenceMeasurability | null; method: string; limitations: string }
  decision: { blockers: string; dependencies: string; timingDrivers: string; accelerators: string; pilotKpis: string }
}
export type TimelinePhaseKey = 'discoveryData' | 'development' | 'integration' | 'pilot' | 'evaluation' | 'adoption' | 'rollout'
export type TimelinePhase = { start: number | null; duration: number | null }
export type DeliveryTimeline = { phases: Record<TimelinePhaseKey, TimelinePhase>; pilotCompletion: number | null; evidenceReady: number | null; timingAssumptions: string }
export type Scenario = {
  impact: number | null; months: number | null; pilotCost: number | null; costMode: 'simple' | 'advanced'; costs: Record<CostKey, number>;
  urgency: Urgency | null; urgencyRationale: string; impactRationale: string; timeRationale: string;
  improvement: string; adoption: string; assumptions: string; rolloutCost: number | null; operatingCost: number | null;
  pilotMonths: number | null; broaderMonths: number | null; firstValueDate: string;
  timeline: DeliveryTimeline;
}
export type Initiative = {
  id: string; name: string; region: string; subregion: string; coveredRegions: string[]; businessUnit: string; function: string; archived: boolean;
  archetype: Archetype | null; secondary: Archetype[]; descriptor: Descriptor | null; descriptorRationale: string;
  impactType: 'Revenue' | 'Productivity' | 'Both' | 'Other'; problem: string; baselineKpi: string; improvementDescription: string; quantitativeEstimate: string;
  evidenceSource: EvidenceSource; evidenceNote: string; reach: string; eligiblePopulation: string; scope: 'Team' | 'Region' | 'Multiple Regions' | 'Global'; activityScope: string;
  strategicObjective: string; workflowImportance: string; consequence: string; meaningfulKpi: string; meaningfulThreshold: string;
  phases: { discovery: number | null; pilot: number | null; evaluation: number | null; rollout: number | null; adoption: number | null };
  urgencyInputs: { severity: Urgency; monthlyImpact: string; deadline: string; delayConsequence: string; reversible: string; workaround: string; workaroundEffectiveness: string; workaroundCost: string; workaroundLimits: string; residualProblem: string; dependentInitiative: string; dependencyType: 'None' | 'Optional' | 'Mandatory'; dependencyStatus: 'Hypothetical' | 'Committed'; alternative: string; dependencyImpact: string };
  feasibility: Record<string, CheckState>; evidence: Record<string, CheckState>; validationAssumptions: string;
  deliveryAssessment: DeliveryAssessment;
  deliveryAssessmentVersion?: 1;
  risks: string; scenarios: Record<ScenarioKey, Scenario>;
}
export type Portfolio = { id: string; name: string; initiatives: Initiative[] }
