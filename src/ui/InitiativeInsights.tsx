import type { Initiative, ScenarioKey } from '../types'
import { managementInterpretation, pilotTotal, readiness, scenarioNames } from '../lib/assessment'
import { urgencyColors } from '../lib/metadata'
import DeliveryTimelineView from './DeliveryTimelineView'
import { effectiveImpact, missingEvidence, selectedAssumptions, suggestImpact } from '../lib/impactGuide'

const money = (n: number | null) => n === null ? 'Not assessed' : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function InitiativeInsights({ item, scenario, onEdit }: { item: Initiative | undefined; scenario: ScenarioKey; onEdit: () => void }) {
  if (!item) return <aside className="insights-panel"><div className="eyebrow">SELECTED INITIATIVE</div><h2>Select an opportunity</h2><p>Add or select an initiative to view its assessment.</p></aside>
  const s = item.scenarios[scenario]
  const d=item.deliveryAssessment
  const suggestion=suggestImpact(s.impactAssessment)
  const assumptions=selectedAssumptions(s.impactAssessment)
  return <aside className="insights-panel" aria-label="Selected initiative insights">
    <div className="eyebrow">SELECTED INITIATIVE · {scenarioNames[scenario].toUpperCase()}</div>
    <h2>{item.name}</h2>
    <div className="insights-archetype">{item.archetype || 'Archetype not selected'}</div>
    <div className="insights-status">{readiness(item)}</div>
    <div className="insights-metrics">
      <div><span>Business Impact</span><b>{effectiveImpact(item,scenario) === null ? '—' : `${effectiveImpact(item,scenario)}/5`}</b></div>
      <div><span>Time to value</span><b>{s.months === null ? '—' : `${s.months} months`}</b></div>
      <div><span>Pilot investment</span><b>{money(pilotTotal(s))}</b></div>
      <div><span>Residual urgency</span><b className="insights-urgency"><i style={{ background: s.urgency ? urgencyColors[s.urgency] : '#aab4b3' }}/>{s.urgency || '—'}</b></div>
    </div>
    {s.impactAssessment?<div className="insights-copy impact-insights"><h3>Why this impact rating?</h3><p>Suggested {suggestion.score??'—'}/5 · Effective {effectiveImpact(item,scenario)??'—'}/5 · {s.impactAssessment.mode==='confirmed'?'Management confirmed':'Model suggested'}</p><ul>{assumptions.map(x=><li key={x.field.key}><b>{x.field.label}:</b> {x.label}</li>)}</ul><p>{suggestion.explanation}</p><p><b>Economic rationale:</b> {s.impactAssessment.economicRationale||'Not recorded.'}</p><p><b>Principal uncertainty:</b> {s.impactAssessment.uncertainty||'Not recorded.'}</p><p><b>Pilot validation:</b> {s.impactAssessment.pilotValidation||'Not recorded.'}</p>{s.impactAssessment.mode==='confirmed'&&s.impactAssessment.confirmedImpact!==suggestion.score?<p><b>Management override:</b> {s.impactAssessment.confirmationRationale}</p>:null}{missingEvidence(s.impactAssessment).length?<p className="impact-evidence-warning">Evidence documentation needed for {missingEvidence(s.impactAssessment).length} assumption(s); potential impact is unchanged.</p>:null}<details><summary>Compare scenario impact</summary>{(['conservative','base','optimistic'] as const).map(key=>{const a=item.scenarios[key].impactAssessment,r=suggestImpact(a);return <p key={key}><b>{scenarioNames[key]}:</b> suggested {r.score??'—'}/5, effective {effectiveImpact(item,key)??'—'}/5. {r.limiting.join('; ')||r.explanation}.</p>})}</details><details><summary>Evidence by assumption</summary>{assumptions.map(x=><p key={x.field.key}><b>{x.field.label}:</b> {x.record?.source||'Unknown'}{x.record?.reference?` · ${x.record.reference}`:''}. {x.record?.rationale||'No rationale recorded.'} Pilot: {x.record?.pilotValidation||'Not recorded.'}</p>)}</details></div>:null}
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
    <div className="insights-copy"><h3>Management interpretation</h3><p className="insights-preview">{managementInterpretation(item, scenario)}</p></div>
    <details className="insights-more"><summary>Full context</summary><div><p><b>Principal assumptions:</b> {s.assumptions || 'Scenario assumptions not documented.'}</p><p><b>Key uncertainty:</b> {item.validationAssumptions || 'Not documented.'}</p><p><b>Management interpretation:</b> {managementInterpretation(item, scenario)}</p></div></details>
    <button className="insights-edit" onClick={onEdit}>Edit assessment ↗</button>
  </aside>
}
