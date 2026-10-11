import type { ImpactThresholds, Initiative, ScenarioKey } from '../types'
import { managementInterpretation, pilotTotal, readiness, scenarioNames } from '../lib/assessment'
import { urgencyColors } from '../lib/metadata'
import DeliveryTimelineView from './DeliveryTimelineView'
import { calculateEconomic, effectiveImpact, impactRating, modelInputs, sensitivity } from '../lib/economics'

const money = (n: number | null) => n === null ? 'Not assessed' : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function InitiativeInsights({ item, scenario, onEdit, thresholds, peers }: { item: Initiative | undefined; scenario: ScenarioKey; onEdit: () => void; thresholds:ImpactThresholds; peers:Initiative[] }) {
  if (!item) return <aside className="insights-panel"><div className="eyebrow">SELECTED INITIATIVE</div><h2>Select an opportunity</h2><p>Add or select an initiative to view its assessment.</p></aside>
  const s = item.scenarios[scenario]
  const d=item.deliveryAssessment
  const economic=calculateEconomic(s.economic)
  const peerNets=peers.map(p=>calculateEconomic(p.scenarios[scenario].economic)).filter((r):r is Extract<typeof r,{status:'calculated'}>=>r.status==='calculated').map(r=>r.net)
  const drivers=s.economic?sensitivity(s.economic,thresholds,peerNets).slice(0,3):[]
  return <aside className="insights-panel" aria-label="Selected initiative insights">
    <div className="eyebrow">SELECTED INITIATIVE · {scenarioNames[scenario].toUpperCase()}</div>
    <h2>{item.name}</h2>
    <div className="insights-archetype">{item.archetype || 'Archetype not selected'}</div>
    <div className="insights-status">{readiness(item)}</div>
    <div className="insights-metrics">
      <div><span>Business Impact</span><b>{effectiveImpact(item,scenario,thresholds) === null ? 'Not calculated' : `${effectiveImpact(item,scenario,thresholds)}/5`}</b></div>
      <div><span>Time to value</span><b>{s.months === null ? '—' : `${s.months} months`}</b></div>
      <div><span>Pilot investment</span><b>{money(pilotTotal(s))}</b></div>
      <div><span>Residual urgency</span><b className="insights-urgency"><i style={{ background: s.urgency ? urgencyColors[s.urgency] : '#aab4b3' }}/>{s.urgency || '—'}</b></div>
    </div>
    {s.economic?<div className="insights-copy economic-insights"><h3>Economic contribution · illustrative</h3>{economic.status==='calculated'?<><p><b>Net annual Accor contribution: {money(economic.net)}</b></p><p>Value created: {money(economic.created)} · Captured contribution: {money(economic.captured)} · Realizable savings: {money(economic.savings)} · Annual operating cost: {money(economic.operatingCost)}.</p>{s.economic.model==='pricing'?<p>Incremental hotel room revenue is {money(economic.components.incrementalHotelRevenue)}; only the assumed capture share enters Accor contribution.</p>:null}{s.economic.model==='pitch'?<p>Existing-proposal wins: {economic.components.extraExistingWins.toFixed(1)} · Capacity proposals: {economic.components.extraProposals.toFixed(1)}, capped by qualified demand.</p>:null}<p>Calculated impact: {impactRating(economic.net,thresholds)}/5 · Final chart impact: {effectiveImpact(item,scenario,thresholds)}/5{s.economic.overrideImpact!==null?' · Management override':''}.</p>{s.economic.overrideImpact!==null?<p><b>Override rationale:</b> {s.economic.overrideRationale}</p>:null}<details><summary>Scenario comparison and sensitivity</summary>{(['conservative','base','optimistic'] as const).map(key=>{const r=calculateEconomic(item.scenarios[key].economic);return <p key={key}>{key}: {r.status==='calculated'?`${money(r.net)} · ${effectiveImpact(item,key,thresholds)}/5`:'Not calculated'}</p>})}<p>One input at a time moves up or down by 10% of its current value, at least 1 unit; percentages stay within 0–100. The larger valid effect is shown. Other inputs stay fixed.</p>{drivers.map(x=><p key={x.key}>{x.label}: {x.from} → {x.to} changes annual contribution by {money(x.change)}{x.crosses?' · crosses impact threshold':''}{x.reorders?' · reverses economic ordering':''}.</p>)}</details></>:<p>Not calculated: {economic.errors.join(' ')}</p>}<p>Main drivers: {modelInputs[s.economic.model].slice(0,4).map(f=>f.label).join(', ')}.</p></div>:null}
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
    <div className="insights-copy"><h3>Principal assumptions</h3><p className="insights-preview">{s.assumptions || 'Scenario assumptions not documented.'}</p></div>
    <div className="insights-copy"><h3>Management interpretation</h3><p className="insights-preview">{managementInterpretation(item, scenario,thresholds)}</p></div>
    <details className="insights-more"><summary>Full context</summary><div><p><b>Principal assumptions:</b> {s.assumptions || 'Scenario assumptions not documented.'}</p><p><b>Key uncertainty:</b> {item.validationAssumptions || 'Not documented.'}</p><p><b>Management interpretation:</b> {managementInterpretation(item, scenario,thresholds)}</p></div></details>
    <button className="insights-edit" onClick={onEdit}>Edit assessment ↗</button>
  </aside>
}
