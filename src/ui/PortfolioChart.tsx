import { useEffect, useRef, useState } from 'react'
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { Initiative, ScenarioKey } from '../types'
import { bubbleRadius, isChartable, pilotTotal, scenarioNames } from '../lib/assessment'
import { axisRangeLabel, type AxisBounds, type AxisMode } from '../lib/chartAxes'
import { coincidentOffsets, placeChartLabels, type LabelLayout } from '../lib/chartLabels'
import { chartDecisionPoint, chartTakeaways, type ChartTakeaway, type DecisionPoint } from '../lib/chartTakeaways'
import { evidenceBands, evidenceColor, unassessedEvidenceColor } from '../lib/evidenceColors'
import { validationRating } from '../lib/economicValidation'
import { download } from '../lib/storage'
import { effectiveImpact, selectedAssumptions, suggestImpact } from '../lib/impactGuide'

type Point = DecisionPoint & { name: string; item: Initiative; offsetX?:number }
type BubbleProps = { cx?: number; cy?: number; payload?: Point; selectedId: string | null; onSelect: (id: string) => void; onFocus: (id: string | null) => void; maxCost: number; label?: LabelLayout; decision: ChartTakeaway; chartWidth: number; chartHeight: number; labels: boolean }
const money = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function Bubble({ cx = 0, cy = 0, payload, selectedId, onSelect, onFocus, maxCost, label, decision, chartWidth, chartHeight, labels }: BubbleProps) {
  if (!payload) return null
  const r = bubbleRadius(payload.cost, maxCost)
  const drawX=cx+(payload.offsetX||0)
  const labelWidth = Math.min(220, Math.max((label?.displayName.length || 0) * 6.5, decision.subtitle.length * 4.8))
  const compact = chartWidth < 500
  let side = label?.side || (drawX > chartWidth * 0.58 ? 'left' : 'right')
  if (side === 'right' && drawX + r + 10 + labelWidth > chartWidth - 8) side = 'left'
  if (side === 'left' && drawX - r - 10 - labelWidth < 8) side = 'right'
  const labelX = compact ? Math.max(47 + labelWidth / 2, Math.min(chartWidth - 28 - labelWidth / 2, drawX)) : drawX + (side === 'right' ? r + 10 : -r - 10)
  const compactY = cy < chartHeight * 0.38 || cy + r + 30 > chartHeight - 48 ? cy - r - 17 : cy + r + 16
  const labelY = compact ? Math.max(55, Math.min(chartHeight - 58, compactY)) : Math.max(55, Math.min(chartHeight - 58, cy + (label?.dy || -3)))
  const moved = Math.abs(labelY - cy) > 22
  return <g className="chart-bubble" onPointerDown={() => onSelect(payload.id)} onClick={() => onSelect(payload.id)} onFocus={event => { if(event.currentTarget.matches(':focus-visible')) onFocus(payload.id) }} onBlur={() => onFocus(null)} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(payload.id) } }} aria-label={`Select ${payload.name}. ${decision.takeaway} ${decision.tradeOff} Business Impact ${payload.impact}/5, economic validation ${payload.validation}/5, pilot investment ${money(payload.cost)}, decision-ready evidence ${payload.evidenceReady===null?'unassessed':`${payload.evidenceReady} months`}, pilot hard gates ${payload.gates}.`}>
    {payload.offsetX ? <><line x1={cx} y1={cy} x2={drawX} y2={cy} stroke="#a9b9b4" strokeWidth="1" pointerEvents="none"/><circle cx={cx} cy={cy} r="2" fill="#647d7d" pointerEvents="none"/></> : null}
    {selectedId === payload.id ? <circle cx={drawX} cy={cy} r={r + 5} fill="none" stroke="#233746" strokeWidth="2" /> : null}
    <circle cx={drawX} cy={cy} r={r} fill={evidenceColor(payload.evidenceReady)} fillOpacity="0.9" stroke="white" strokeWidth="2" />
    {labels && moved ? <line x1={compact ? drawX : drawX + (side === 'right' ? r : -r)} y1={compact ? cy + (labelY > cy ? r : -r) : cy} x2={labelX} y2={labelY + 3} stroke="#a9b9b4" strokeWidth="1" pointerEvents="none" /> : null}
    {labels ? <text x={labelX} y={labelY} textAnchor={compact ? 'middle' : side === 'right' ? 'start' : 'end'} pointerEvents="none" className="bubble-label">
      <tspan x={labelX} fontSize="11" fontWeight="800" fill="#24464d">{label?.displayName || payload.name}</tspan>
      <tspan x={labelX} dy="14" fontSize="9" fill="#738c88">{decision.subtitle}</tspan>
    </text> : null}
  </g>
}

function TooltipBody({ point, decision }: { point: Point; decision: ChartTakeaway }) {
  return <div className="chart-tooltip"><strong>{point.name}</strong><span className="chart-tooltip-archetype">{point.item.archetype||'Archetype unassessed'}</span><span><b>Pilot decision takeaway</b> {decision.takeaway}</span><span><b>Trade-off</b> {decision.tradeOff}</span><div className="chart-tooltip-summary"><b>Key metrics</b><span>Impact {point.impact}/5 · Validation {point.validation}/5</span><span>Pilot {money(point.cost)} · Gates {point.gates}</span><span>Decision-ready evidence: {point.evidenceReady===null?'Unassessed':`month ${point.evidenceReady}`}</span></div></div>
}

function ChartTooltip({ active, payload, takeaways }: { active?: boolean; payload?: Array<{ payload: Point }>; takeaways: Record<string, ChartTakeaway> }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const decision = takeaways[point.id]
  return decision ? <TooltipBody point={point} decision={decision}/> : null
}

export default function PortfolioChart({ items, scenario, selectedId, onSelect, bounds, mode, lockAxes, labels, overlay, controls }: { items: Initiative[]; scenario: ScenarioKey; selectedId: string | null; onSelect: (id: string) => void; bounds: AxisBounds; mode: AxisMode; lockAxes: boolean; labels: boolean; overlay: boolean; controls?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(760)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(entries => setChartWidth(entries[0].contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const chartHeight = chartWidth < 520 ? 420 : 450
  const allPoints: Point[] = items.flatMap(item => {const point=chartDecisionPoint(item,scenario);return point?[{...point,name:item.name,item}]:[]})
  const visiblePoints = allPoints.filter(point => point.validation >= bounds.y[0] && point.validation <= bounds.y[1])
  const costCandidates = lockAxes ? items.flatMap(item => (['conservative', 'base', 'optimistic'] as ScenarioKey[]).filter(key => isChartable(item, key)).map(key => pilotTotal(item.scenarios[key]) || 0)) : visiblePoints.map(point => point.cost)
  const maxCost = Math.max(1, ...costCandidates)
  const offsets=coincidentOffsets(visiblePoints.map(point=>({id:point.id,impact:point.impact,validation:point.validation,radius:bubbleRadius(point.cost,maxCost)})))
  const points=visiblePoints.map(point=>({...point,offsetX:offsets[point.id]}))
  const takeaways = chartTakeaways(points)
  const focusedPoint = points.find(point => point.id === focusedId)
  const costScaleLabel = lockAxes ? 'shared scale max' : 'max shown'
  const layouts = placeChartLabels(points.map(point => ({ id: point.id, name: point.name, subtitle: takeaways[point.id].subtitle, impact: point.impact, validation: point.validation, radius: bubbleRadius(point.cost, maxCost), offsetX:point.offsetX })), bounds, chartWidth, chartHeight)
  const selected = items.find(item => item.id === selectedId)
  const paths = selected && overlay ? (['conservative', 'base', 'optimistic'] as ScenarioKey[]).filter(key => isChartable(selected, key)).map(key => ({ key, validation:validationRating(selected,key)! })) : []
  const rangeLabel = axisRangeLabel(bounds)

  function exportSvg() {
    const source = ref.current?.querySelector('svg')
    if (!source) return
    const clone = source.cloneNode(true) as SVGSVGElement
    const description=document.createElementNS('http://www.w3.org/2000/svg','desc')
    description.textContent=JSON.stringify(points.map(point=>{const assessment=point.item.scenarios[scenario].impactAssessment;return {initiative:point.name,effectiveImpact:point.impact,economicValidation:point.validation,evidenceReadyMonth:point.evidenceReady,pilotInvestment:point.cost,decisionTakeaway:takeaways[point.id].subtitle,suggestedImpact:assessment?suggestImpact(assessment).score:null,mode:assessment?.mode??'manual',assumptions:selectedAssumptions(assessment).map(x=>`${x.field.label}: ${x.label}`)}}))
    clone.prepend(description)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', '1030'); clone.setAttribute('height', '535')
    clone.setAttribute('viewBox', `0 0 ${source.clientWidth || chartWidth} ${source.clientHeight || chartHeight}`)
    const content = new XMLSerializer().serializeToString(clone)
    const scaleName = mode === 'fit' ? 'Fit to Initiatives' : 'Full Scale'
    const footer = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="740"><rect width="1120" height="740" fill="#fff"/><text x="45" y="38" font-family="Arial" font-size="23" font-weight="700" fill="#17313b">AI Initiative Portfolio Explorer — ${scenarioNames[scenario]}</text><text x="45" y="62" font-family="Arial" font-size="13" fill="#5d6a72">${scaleName} · ${rangeLabel}${lockAxes ? ' · axes locked across scenarios' : ''}</text><text x="45" y="82" font-family="Arial" font-size="12" fill="#5d6a72">X: Potential Business Impact (1–5) · Y: Ability to Validate Economic Value (1–5) · Area: pilot investment (EUR)</text><g transform="translate(45,94)">${content}</g><circle cx="55" cy="654" r="6" fill="#319482"/><text x="68" y="659" font-family="Arial" font-size="13" fill="#17313b">Evidence 0–3 mo</text><circle cx="220" cy="654" r="6" fill="#4e86bd"/><text x="233" y="659" font-family="Arial" font-size="13" fill="#17313b">&gt;3–6 mo</text><circle cx="337" cy="654" r="6" fill="#73649e"/><text x="350" y="659" font-family="Arial" font-size="13" fill="#17313b">&gt;6 mo</text><circle cx="441" cy="654" r="6" fill="#9ba9ad"/><text x="454" y="659" font-family="Arial" font-size="13" fill="#17313b">Unassessed</text><circle cx="620" cy="654" r="7" fill="none" stroke="#8da4a0"/><circle cx="659" cy="654" r="17" fill="none" stroke="#8da4a0"/><text x="685" y="659" font-family="Arial" font-size="13" fill="#17313b">Pilot cost; ${costScaleLabel} ${money(maxCost)}</text><text x="45" y="704" font-family="Arial" font-size="12" fill="#687b78">Validation rating measures the strength of the pilot's economic evidence, not its likelihood of success.</text><text x="45" y="724" font-family="Arial" font-size="12" fill="#7b858b">Illustrative data — not actual Accor performance or forecasts. Scenarios are planning assumptions.</text></svg>`
    download(`portfolio-chart-${scenario}.svg`, footer, 'image/svg+xml')
  }

  return <section className="chart-section" aria-label="Portfolio visualization">
    <div className="section-heading"><div><div className="eyebrow">PORTFOLIO MAP</div><h2>Opportunities at a glance</h2><p>Bubble area shows pilot investment. Color shows time to decision-ready evidence.</p></div><div className="chart-header-actions">{controls}<button className="text-button" onClick={exportSvg}>Export chart SVG ↗</button></div></div>
    <div className="chart-range"><span>{mode === 'fit' ? 'FIT TO INITIATIVES' : 'FULL SCALE'}</span><span>{rangeLabel}</span>{lockAxes ? <span>Axes locked across scenarios</span> : null}</div>
    <div className="chart-frame" ref={ref}>
      <div className="chart-y-label">ABILITY TO VALIDATE ECONOMIC VALUE · 1–5 <span>↑ stronger evidence</span></div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ScatterChart margin={{ top: 34, right: 24, bottom: 18, left: 0 }}>
          <CartesianGrid stroke="#e6ebe9" strokeDasharray="3 4" />
          <XAxis type="number" dataKey="impact" domain={bounds.x} allowDataOverflow padding={{ left: 60, right: 60 }} ticks={bounds.xTicks} tickLine={false} axisLine={{ stroke: '#aebbb8' }} tick={{ fontSize: 12, fill: '#5b6a70' }} />
          <YAxis type="number" dataKey="validation" domain={bounds.y} allowDataOverflow padding={{ top: 42, bottom: 42 }} ticks={bounds.yTicks} tickLine={false} axisLine={{ stroke: '#aebbb8' }} tick={{ fontSize: 12, fill: '#5b6a70' }} width={43} />
          <Tooltip cursor={{ stroke: '#99aaa9', strokeDasharray: '4 3' }} allowEscapeViewBox={{ x: true, y: true }} content={<ChartTooltip takeaways={takeaways} />} />
          <Scatter data={points} shape={(props: unknown) => { const p = props as { cx: number; cy: number; payload: Point }; return <Bubble {...p} selectedId={selectedId} onSelect={onSelect} onFocus={setFocusedId} maxCost={maxCost} label={layouts[p.payload?.id]} decision={takeaways[p.payload?.id]} chartWidth={chartWidth} chartHeight={chartHeight} labels={labels} /> }} />
          {paths.map(({ key, validation }) => <Scatter key={key} data={[{ impact: effectiveImpact(selected!,key), validation }]} shape={(props: unknown) => { const p = props as { cx: number; cy: number }; return <g><circle cx={p.cx} cy={p.cy} r="5" fill="#17313b" stroke="white" strokeWidth="2"/><text x={p.cx + 9} y={p.cy - 9} fill="#17313b" fontSize="11">{scenarioNames[key]}</text></g> }} />)}
        </ScatterChart>
      </ResponsiveContainer>
      {focusedPoint ? <div className="chart-focus-tooltip"><TooltipBody point={focusedPoint} decision={takeaways[focusedPoint.id]}/></div> : null}
      <div className="chart-x-label">POTENTIAL BUSINESS IMPACT · 1–5 →</div>
      {!points.length ? <div className="chart-empty">No assessed initiatives fit this view. Confirm Business Impact, Economic Validation and pilot investment to plot a bubble.</div> : null}
    </div>
    <div className="chart-footer"><div className="urgency-legend"><b>Decision-ready evidence</b>{evidenceBands.map(band=><span key={band.label}><i style={{background:band.color}}/>{band.label}</span>)}<span><i style={{background:unassessedEvidenceColor}}/>Unassessed</span></div><div className="size-legend"><span>Bubble area = pilot cost</span><i className="size-small"/><i className="size-large"/><span>{money(maxCost)} {costScaleLabel}</span></div></div>
    {Object.values(offsets).some(offset=>offset!==0)?<div className="chart-note">Bubbles with the same ratings are separated for readability; connector lines mark their shared assessed position.</div>:null}
    <div className="chart-note">Fit changes the view, not assessments. Validation strength and evidence timing are separate; neither implies the pilot will succeed.</div>
  </section>
}
