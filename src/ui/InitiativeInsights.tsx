import type { Initiative, ScenarioKey } from '../types'
import { fundingGateLabel, pilotGateLabels, pilotGateState, pilotHardGateStatus, pilotTotal, scenarioNames } from '../lib/assessment'
import { urgencyColors } from '../lib/metadata'
import { effectiveImpact } from '../lib/impactGuide'
import ImpactDecisionRationale from './ImpactDecisionRationale'

const money = (n: number | null) => n === null ? 'Not assessed' : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function InitiativeInsights({ item, scenario, peers, onEdit }: { item: Initiative | undefined; scenario: ScenarioKey; peers: Initiative[]; onEdit: () => void }) {
  if (!item) return <aside className="insights-panel"><div className="eyebrow">SELECTED INITIATIVE</div><h2>Select an opportunity</h2><p>Add or select an initiative to view its assessment.</p></aside>
  const s = item.scenarios[scenario]
  const gateStatus = pilotHardGateStatus(item)
  return <aside className="insights-panel" aria-label="Selected initiative insights">
    <div className="insights-header"><div className="eyebrow">SELECTED INITIATIVE · {scenarioNames[scenario].toUpperCase()}</div><button className="insights-edit" onClick={onEdit}>Edit assessment ↗</button></div>
    <h2>{item.name}</h2>
    <div className="insights-archetype">{item.archetype || 'Archetype not selected'}</div>
    <div className="insights-metrics">
      <div><span>Business Impact</span><b>{effectiveImpact(item,scenario) === null ? '—' : `${effectiveImpact(item,scenario)}/5`}</b></div>
      <div><span>Time to value</span><b>{s.months === null ? '—' : `${s.months} months`}</b></div>
      <div><span>Pilot investment</span><b>{money(pilotTotal(s))}</b></div>
      <div><span>Residual urgency</span><b className="insights-urgency"><i style={{ background: s.urgency ? urgencyColors[s.urgency] : '#aab4b3' }}/>{s.urgency || '—'}</b></div>
    </div>
    <div className="insights-gates">
      <div className="insights-gate-status"><span>Pilot Hard Gates</span><b className={`status ${gateStatus === 'Blocked' ? 'status-blocked' : gateStatus === 'Passed' ? 'status-ready' : ''}`}>{gateStatus}</b></div>
      <details className="insights-gate-details"><summary>View gate checklist</summary>
        <ul>{pilotGateLabels.map(label => <li key={label}><span>{label}</span><b>{pilotGateState(item, label)}</b></li>)}</ul>
        <div className="insights-funding"><span>{fundingGateLabel} <small>Launch authorization</small></span><b>{pilotGateState(item, fundingGateLabel)}</b></div>
      </details>
    </div>
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
  </aside>
}
