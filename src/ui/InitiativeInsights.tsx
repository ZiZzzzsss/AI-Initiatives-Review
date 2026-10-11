import type { Initiative, ScenarioKey } from '../types'
import { managementInterpretation, pilotTotal, readiness, scenarioNames } from '../lib/assessment'
import { urgencyColors } from '../lib/metadata'
import DeliveryTimelineView from './DeliveryTimelineView'
import { effectiveImpact } from '../lib/impactGuide'
import ImpactDecisionRationale from './ImpactDecisionRationale'

const money = (n: number | null) => n === null ? 'Not assessed' : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function InitiativeInsights({ item, scenario, peers, onEdit }: { item: Initiative | undefined; scenario: ScenarioKey; peers: Initiative[]; onEdit: () => void }) {
  if (!item) return <aside className="insights-panel"><div className="eyebrow">SELECTED INITIATIVE</div><h2>Select an opportunity</h2><p>Add or select an initiative to view its assessment.</p></aside>
  const s = item.scenarios[scenario]
  const d=item.deliveryAssessment
  return <aside className="insights-panel" aria-label="Selected initiative insights">
    <div className="insights-header"><div className="eyebrow">SELECTED INITIATIVE · {scenarioNames[scenario].toUpperCase()}</div><button className="insights-edit" onClick={onEdit}>Edit assessment ↗</button></div>
    <h2>{item.name}</h2>
    <div className="insights-archetype">{item.archetype || 'Archetype not selected'}</div>
    <div className="insights-status">{readiness(item)}</div>
    <div className="insights-metrics">
      <div><span>Business Impact</span><b>{effectiveImpact(item,scenario) === null ? '—' : `${effectiveImpact(item,scenario)}/5`}</b></div>
      <div><span>Time to value</span><b>{s.months === null ? '—' : `${s.months} months`}</b></div>
      <div><span>Pilot investment</span><b>{money(pilotTotal(s))}</b></div>
      <div><span>Residual urgency</span><b className="insights-urgency"><i style={{ background: s.urgency ? urgencyColors[s.urgency] : '#aab4b3' }}/>{s.urgency || '—'}</b></div>
    </div>
    {s.impactAssessment ? <ImpactDecisionRationale item={item} scenario={scenario} peers={peers}/> : null}
    <div className="insights-delivery"><h3>Delivery & evidence</h3><div className="delivery-status-grid">
      <div><span>Data Readiness</span><b>{d.dataReadiness.status||'Not assessed'}</b></div>
      <div><span>Technical Complexity</span><b>{d.technicalComplexity.rating||'Not assessed'}</b></div>
      <div><span>Implementation Complexity</span><b>{d.implementationComplexity.rating||'Not assessed'}</b></div>
      <div><span>Evidence Measurability</span><b>{d.evidenceMeasurability.rating||'Not assessed'}</b></div>
    </div><details className="insights-more"><summary>Assessment reasons & timeline</summary><div className="insights-delivery-detail">
      <p><b>Data:</b> {d.dataReadiness.explanation||'Not documented.'}</p><p><b>Sources:</b> {d.dataReadiness.sources||'Not documented.'}</p>
      <p><b>Technical:</b> {d.technicalComplexity.explanation||'Not documented.'}</p><p><b>Implementation:</b> {d.implementationComplexity.explanation||'Not documented.'}</p>
      <p><b>Evaluation method:</b> {d.evidenceMeasurability.method||'Not documented.'}</p><p><b>Evidence limits:</b> {d.evidenceMeasurability.limitations||'Not documented.'}</p>
      <DeliveryTimelineView scenario={s}/>
      <p><b>What could accelerate delivery:</b> {d.decision.accelerators||'Not documented.'}</p>
    </div></details></div>
    {!s.impactAssessment?<div className="insights-copy"><h3>Principal assumptions</h3><p className="insights-preview">{s.assumptions || 'Scenario assumptions not documented.'}</p></div>:null}
    <details className="insights-more"><summary>Management interpretation &amp; context</summary><div><p>{managementInterpretation(item, scenario)}</p><p><b>Principal planning assumptions:</b> {s.assumptions || 'Not documented.'}</p><p><b>Additional uncertainty:</b> {item.validationAssumptions || 'Not documented.'}</p></div></details>
  </aside>
}
