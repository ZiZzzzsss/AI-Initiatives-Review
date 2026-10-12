import type { Initiative, ScenarioKey } from '../types'
import { fundingGateLabel, pilotGateLabels, pilotGateState, pilotHardGateStatus, pilotTotal, scenarioNames } from '../lib/assessment'
import { urgencyColors } from '../lib/metadata'
import { effectiveImpact } from '../lib/impactGuide'
import { validationRating } from '../lib/economicValidation'
import { regionLabel } from '../lib/classification'
import type { ChartTakeaway } from '../lib/chartTakeaways'
import ImpactDecisionRationale from './ImpactDecisionRationale'

const money = (n: number | null) => n === null ? 'Not assessed' : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function InitiativeInsights({ item, scenario, peers, decision, onEdit }: { item: Initiative | undefined; scenario: ScenarioKey; peers: Initiative[]; decision?: ChartTakeaway; onEdit: () => void }) {
  if (!item) return <aside className="insights-panel"><div className="eyebrow">SELECTED INITIATIVE</div><h2>Select an opportunity</h2><p>Add or select an initiative to view its assessment.</p></aside>
  const s = item.scenarios[scenario]
  const gateStatus = pilotHardGateStatus(item)
  const validation=s.economicValidation
  return <aside className="insights-panel" aria-label="Selected initiative insights">
    <div className="insights-header"><div className="eyebrow">SELECTED INITIATIVE · {scenarioNames[scenario].toUpperCase()}</div><button className="insights-edit" onClick={onEdit}>Edit assessment ↗</button></div>
    <h2>{item.name}</h2>
    <div className="insights-archetype">{item.archetype || 'Archetype not selected'} · {regionLabel(item)}</div>
    <div className="insights-metrics">
      <div><span>Business Impact</span><b>{effectiveImpact(item,scenario) === null ? '—' : `${effectiveImpact(item,scenario)}/5`}</b></div>
      <div><span>Economic Value Validation</span><b>{validationRating(item,scenario) === null ? 'Unassessed' : `${validationRating(item,scenario)}/5`}</b></div>
      <div><span>Pilot investment</span><b>{money(pilotTotal(s))}</b></div>
      <div><span>Decision-ready evidence</span><b>{s.timeline.evidenceReady === null ? 'Unassessed' : `${s.timeline.evidenceReady} months`}</b></div>
    </div>
    <div className="insights-gates">
      <div className="insights-gate-status"><span>Pilot Hard Gates</span><b className={`status ${gateStatus === 'Blocked' ? 'status-blocked' : gateStatus === 'Passed' ? 'status-ready' : ''}`}>{gateStatus}</b></div>
      <details className="insights-gate-details"><summary>View gate checklist</summary>
        <ul>{pilotGateLabels.map(label => <li key={label}><span>{label}</span><b>{pilotGateState(item, label)}</b></li>)}</ul>
        <div className="insights-funding"><span>{fundingGateLabel} <small>Launch authorization</small></span><b>{pilotGateState(item, fundingGateLabel)}</b></div>
      </details>
    </div>
    <p className="insights-decision"><b>Pilot Decision Takeaway</b> {decision?`${decision.takeaway} ${decision.tradeOff}`:'Confirm the Economic Value Validation assessment to compare this initiative on the matrix.'}</p>
    {s.impactAssessment ? <ImpactDecisionRationale item={item} scenario={scenario} peers={peers}/> : <section className="impact-decision" aria-label="Business Impact Decision Rationale">
      <h3>Business Impact Decision Rationale</h3>
      <p className="impact-executive-why">{s.impactRationale || 'Business Impact rationale has not been recorded.'}</p>
      <dl className="impact-executive-assumptions">
        <div><dt>Planning assumptions</dt><dd>{s.assumptions || 'Not recorded'}</dd></div>
        <div><dt>Impact evidence</dt><dd>{item.evidenceSource}</dd></div>
        <div><dt>Assessment basis</dt><dd>Manual rating</dd></div>
      </dl>
      <p className="impact-executive-uncertainty"><b>Critical uncertainty</b> {item.validationAssumptions || 'Not recorded.'}</p>
      <p className="impact-executive-evidence">{item.evidenceSource === 'Unknown' ? 'Evidence source to validate' : `Evidence source · ${item.evidenceSource}`}</p>
    </section>}
    <details className="insights-assessment"><summary>View pilot decision details</summary><div className="insights-assessment-body">
      <section><h3>Strategic Potential</h3><p><b>Business Impact:</b> {effectiveImpact(item,scenario)===null?'Unassessed':`${effectiveImpact(item,scenario)}/5`}</p><p><b>Archetype:</b> {item.archetype||'Unassessed'}</p><p><b>Regional applicability:</b> {regionLabel(item)}</p></section>
      <section><h3>Pilot Evidence</h3><p><b>Economic Value Validation:</b> {validationRating(item,scenario)===null?'Unassessed':`${validationRating(item,scenario)}/5`}. {validation?.rationale||'Assessment rationale not recorded.'}</p><p><b>Critical investment hypothesis:</b> {validation?.criticalHypothesis||'Not recorded.'}</p><p><b>Primary economic KPI:</b> {validation?.businessKpi||validation?.measurableOutcome||'Not recorded.'}</p><p><b>Evaluation method and attribution:</b> {validation?.evaluationDesign||validation?.pilotMethod||'Not recorded.'}</p><p><b>Rollout relevance:</b> {validation?.representativePopulation||'Not recorded.'} {validation?.extrapolationLimits||''}</p><p><b>Evidence limitations:</b> {validation?.evidenceLimitations||'Not recorded.'}</p><p><b>Minimum result for scale:</b> {validation?.decisionThreshold||validation?.minimumImprovement||'Not estimated.'}</p></section>
      <section><h3>Cost of Learning</h3><p><b>Pilot investment:</b> {money(pilotTotal(s))}</p><p><b>Decision-ready evidence:</b> {s.timeline.evidenceReady===null?'Unassessed':`Month ${s.timeline.evidenceReady}`}</p><p><b>Operational risk:</b> {item.risks||'Not recorded.'}</p><p><b>Time to first business value:</b> {s.months===null?'Unassessed':`${s.months} months`}</p><p><b>Residual urgency:</b> <i className="insights-risk-dot" style={{background:s.urgency?urgencyColors[s.urgency]:'#aab4b3'}}/>{s.urgency||'Unassessed'}</p></section>
      <section><h3>Execution Readiness</h3><p><b>Data readiness:</b> {item.deliveryAssessment.dataReadiness.status||'Unassessed'}</p><p><b>Technical complexity:</b> {item.deliveryAssessment.technicalComplexity.rating||'Unassessed'}</p><p><b>Implementation complexity:</b> {item.deliveryAssessment.implementationComplexity.rating||'Unassessed'}</p><p><b>Pilot Hard Gates:</b> {gateStatus}</p><p><b>Critical dependencies:</b> {item.deliveryAssessment.decision.dependencies||'Not recorded.'}</p></section>
    </div></details>
  </aside>
}
