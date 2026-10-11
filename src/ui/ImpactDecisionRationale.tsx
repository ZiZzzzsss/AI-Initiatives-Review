import { useState } from 'react'
import type { Initiative, ScenarioKey } from '../types'
import { scenarioNames } from '../lib/assessment'
import { effectiveImpact, guides, missingEvidence, selectedAssumptions, suggestImpact } from '../lib/impactGuide'
import { counterfactualImpact, defaultCounterfactual, impactDecision, impactWhy, rationaleGuides } from '../lib/impactRationale'

export default function ImpactDecisionRationale({ item, scenario, peers }: { item: Initiative; scenario: ScenarioKey; peers: Initiative[] }) {
  const assessment = item.scenarios[scenario].impactAssessment
  if (!assessment) return null
  return <DecisionBody key={`${item.id}:${scenario}`} item={item} scenario={scenario} peers={peers} />
}

function DecisionBody({ item, scenario, peers }: { item: Initiative; scenario: ScenarioKey; peers: Initiative[] }) {
  const assessment = item.scenarios[scenario].impactAssessment!
  const guide = guides[assessment.guide]
  const narrative = rationaleGuides[assessment.guide]
  const [fieldKey, setFieldKey] = useState(narrative.priority)
  const [alternative, setAlternative] = useState(() => defaultCounterfactual(assessment, narrative.priority))
  const field = guide.fields.find(x => x.key === fieldKey) ?? guide.fields[0]
  const current = field.choices.find(x => x.value === assessment.assumptions[field.key]?.value)
  const alternativeChoice = field.choices.find(x => x.value === alternative)
  const direction = !current || !alternativeChoice ? 'different' : alternativeChoice.ceiling < current.ceiling ? 'weaker' : alternativeChoice.ceiling > current.ceiling ? 'stronger' : 'unchanged'
  const suggestion = suggestImpact(assessment)
  const preview = counterfactualImpact(assessment, field.key, alternative)
  const evidenceNeeded = missingEvidence(assessment)
  const selected = selectedAssumptions(assessment)
  const changeField = (key: string) => {
    setFieldKey(key)
    setAlternative(defaultCounterfactual(assessment, key))
  }
  return <section className="impact-decision" aria-label="Business Impact Decision Rationale">
    <h3>Business Impact Decision Rationale</h3>
    <p className="impact-decision-status">{scenarioNames[scenario]} · Suggested {suggestion.score ?? '—'}/5 · Chart {effectiveImpact(item, scenario) ?? '—'}/5 · {assessment.mode === 'confirmed' ? 'Management confirmed' : 'Model suggested'}</p>
    {assessment.mode === 'confirmed' && assessment.confirmedImpact !== suggestion.score ? <p className="impact-override"><b>Management override:</b> {assessment.confirmationRationale || 'Rationale needed.'} The preview below changes the model suggestion only.</p> : null}

    <div className="impact-decision-block">
      <h4>Why this impact?</h4>
      <p>{impactWhy(assessment)}</p>
    </div>

    <div className="impact-decision-block">
      <h4>Supporting assumptions</h4>
      <ul className="impact-assumption-list">{selected.map(x => <li key={x.field.key}>
        <b>{x.field.label}: {x.label}</b>
        <span>{x.field.choices.find(choice => choice.value === x.record?.value)?.meaning ?? 'Choose a value to assess impact.'} {x.field.why} {x.record?.rationale}</span>
        <em>{x.record?.source === 'Observed' ? 'Observed' : `Unvalidated · ${x.record?.source ?? 'Unknown'}`}</em>
      </li>)}</ul>
      {evidenceNeeded.length ? <p className="impact-evidence-warning">Documentation needed for {evidenceNeeded.join(', ')}. Missing evidence does not lower potential impact.</p> : null}
      <details><summary>Evidence gaps and sources</summary><ul>{narrative.evidenceGaps.map(gap => <li key={gap}>{gap}</li>)}</ul>{selected.map(x => <p key={x.field.key}><b>{x.field.label}:</b> {x.record?.source ?? 'Unknown'}{x.record?.reference ? ` · ${x.record.reference}` : ''}. {x.record?.rationale || 'No rationale recorded.'} Pilot: {x.record?.pilotValidation || 'Not recorded.'}</p>)}</details>
    </div>

    <div className="impact-decision-block">
      <h4>What could change our assessment?</h4>
      <p><b>Priority uncertainty:</b> {guide.fields.find(x => x.key === narrative.priority)?.label}. {assessment.uncertainty || narrative.weakHypothesis}</p>
      <label className="impact-counterfactual-control">Test an assumption
        <select value={field.key} onChange={event => changeField(event.target.value)}>{guide.fields.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
      </label>
      <label className="impact-counterfactual-control">Alternative finding
        <select value={alternative} onChange={event => setAlternative(event.target.value)}>{field.choices.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select>
      </label>
      <p className="impact-counterfactual-result">{current?.label ?? 'Not selected'} → {alternativeChoice?.label ?? 'Not selected'} · Suggested {suggestion.score ?? '—'}/5 → <b>{preview.score ?? '—'}/5</b></p>
      <p>{preview.score === suggestion.score ? `The suggestion does not change. ${preview.limiting.length ? `Still limiting: ${preview.limiting.join('; ')}.` : preview.explanation}` : preview.explanation}</p>
      <p><b>What to test:</b> {narrative.fieldChecks[field.key]} {direction === 'weaker' ? field.key === narrative.priority ? narrative.weakHypothesis : `A weaker finding would be ${alternativeChoice?.meaning.toLowerCase() ?? 'a lower contribution than expected'}` : direction === 'stronger' ? `A stronger finding would be ${alternativeChoice?.meaning.toLowerCase() ?? 'a larger contribution than expected'}` : ''}</p>
      {field.key === narrative.priority ? <details><summary>Pilot validation steps</summary><ul>{narrative.pilotChecks.map(check => <li key={check}>{check}</li>)}</ul></details> : null}
      <p className="impact-preview-note">Preview only. Saved assumptions, chart position and management confirmation stay unchanged.</p>
    </div>

    <div className="impact-decision-block">
      <h4>Decision implication</h4>
      <p>{impactDecision(item, scenario, preview.score, peers, direction !== 'unchanged')}</p>
    </div>
    <details><summary>Compare all scenarios</summary>{(['conservative', 'base', 'optimistic'] as const).map(key => { const a = item.scenarios[key].impactAssessment; const result = suggestImpact(a); return <p key={key}><b>{scenarioNames[key]}:</b> suggested {result.score ?? '—'}/5, chart {effectiveImpact(item, key) ?? '—'}/5. {result.limiting.join('; ') || result.explanation}</p> })}</details>
  </section>
}
