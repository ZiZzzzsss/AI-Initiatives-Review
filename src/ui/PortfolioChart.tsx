import { useEffect, useRef, useState } from 'react'
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { Initiative, ScenarioKey, Urgency } from '../types'
import { bubbleRadius, isComplete, pilotTotal, scenarioNames } from '../lib/assessment'
import { axisRangeLabel, type AxisBounds, type AxisMode } from '../lib/chartAxes'
import { placeChartLabels, type LabelLayout } from '../lib/chartLabels'
import { urgencyColors } from '../lib/metadata'
import { download } from '../lib/storage'
import { effectiveImpact, selectedAssumptions, suggestImpact } from '../lib/impactGuide'

type Point = { id: string; name: string; impact: number; months: number; cost: number; urgency: Urgency; item: Initiative }
type BubbleProps = { cx?: number; cy?: number; payload?: Point; selectedId: string | null; onSelect: (id: string) => void; maxCost: number; label?: LabelLayout; chartWidth: number; chartHeight: number; labels: boolean }
const money = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function Bubble({ cx = 0, cy = 0, payload, selectedId, onSelect, maxCost, label, chartWidth, chartHeight, labels }: BubbleProps) {
  if (!payload) return null
  const r = bubbleRadius(payload.cost, maxCost)
  const labelWidth = Math.min(200, Math.max((label?.displayName.length || 0) * 6.5, (payload.item.archetype?.length || 0) * 5.4))
  const compact = chartWidth < 500
  let side = label?.side || (cx > chartWidth * 0.58 ? 'left' : 'right')
  if (side === 'right' && cx + r + 10 + labelWidth > chartWidth - 8) side = 'left'
  if (side === 'left' && cx - r - 10 - labelWidth < 8) side = 'right'
  const labelX = compact ? Math.max(47 + labelWidth / 2, Math.min(chartWidth - 28 - labelWidth / 2, cx)) : cx + (side === 'right' ? r + 10 : -r - 10)
  const compactY = cy < chartHeight * 0.38 || cy + r + 30 > chartHeight - 48 ? cy - r - 17 : cy + r + 16
  const labelY = compact ? Math.max(55, Math.min(chartHeight - 58, compactY)) : Math.max(55, Math.min(chartHeight - 58, cy + (label?.dy || -3)))
  const moved = Math.abs(labelY - cy) > 22
  return <g className="chart-bubble" onClick={() => onSelect(payload.id)} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(payload.id) } }} aria-label={`Select ${payload.name}, ${payload.item.archetype}, ${payload.urgency} urgency`}>
    {selectedId === payload.id ? <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#233746" strokeWidth="2" /> : null}
    <circle cx={cx} cy={cy} r={r} fill={urgencyColors[payload.urgency]} fillOpacity="0.88" stroke="white" strokeWidth="2" />
    {labels && moved ? <line x1={compact ? cx : cx + (side === 'right' ? r : -r)} y1={compact ? cy + (labelY > cy ? r : -r) : cy} x2={labelX} y2={labelY + 3} stroke="#a9b9b4" strokeWidth="1" pointerEvents="none" /> : null}
    {labels ? <text x={labelX} y={labelY} textAnchor={compact ? 'middle' : side === 'right' ? 'start' : 'end'} pointerEvents="none" className="bubble-label">
      <tspan x={labelX} fontSize="11" fontWeight="800" fill="#24464d">{label?.displayName || payload.name}</tspan>
      <tspan x={labelX} dy="14" fontSize="9" fill="#738c88">{payload.item.archetype}</tspan>
    </text> : null}
  </g>
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return <div className="chart-tooltip"><strong>{point.name}</strong><span>{point.item.archetype}</span><div className="chart-tooltip-summary">{point.impact}/5 impact · {point.months} mo · {money(point.cost)} · {point.urgency} urgency</div></div>
}

export default function PortfolioChart({ items, scenario, selectedId, onSelect, bounds, mode, lockAxes, labels, overlay, controls }: { items: Initiative[]; scenario: ScenarioKey; selectedId: string | null; onSelect: (id: string) => void; bounds: AxisBounds; mode: AxisMode; lockAxes: boolean; labels: boolean; overlay: boolean; controls?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(760)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(entries => setChartWidth(entries[0].contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const chartHeight = chartWidth < 520 ? 420 : 450
  const allPoints: Point[] = items.filter(item => isComplete(item, scenario)).map(item => {
    const s = item.scenarios[scenario]
    return { id: item.id, name: item.name, impact: effectiveImpact(item,scenario)!, months: s.months!, cost: pilotTotal(s)!, urgency: s.urgency!, item }
  })
  const points = allPoints.filter(point => point.months >= bounds.y[0] && point.months <= bounds.y[1])
  const costCandidates = lockAxes ? items.flatMap(item => (['conservative', 'base', 'optimistic'] as ScenarioKey[]).filter(key => isComplete(item, key)).map(key => pilotTotal(item.scenarios[key]) || 0)) : points.map(point => point.cost)
  const maxCost = Math.max(1, ...costCandidates)
  const costScaleLabel = lockAxes ? 'shared scale max' : 'max shown'
  const layouts = placeChartLabels(points.map(point => ({ id: point.id, name: point.name, archetype: point.item.archetype || '', impact: point.impact, months: point.months, radius: bubbleRadius(point.cost, maxCost) })), bounds, chartWidth, chartHeight)
  const selected = items.find(item => item.id === selectedId)
  const paths = selected && overlay ? (['conservative', 'base', 'optimistic'] as ScenarioKey[]).filter(key => isComplete(selected, key)).map(key => ({ key, s: selected.scenarios[key] })) : []
  const rangeLabel = axisRangeLabel(bounds)

  function exportSvg() {
    const source = ref.current?.querySelector('svg')
    if (!source) return
    const clone = source.cloneNode(true) as SVGSVGElement
    const description=document.createElementNS('http://www.w3.org/2000/svg','desc')
    description.textContent=JSON.stringify(points.map(point=>{const assessment=point.item.scenarios[scenario].impactAssessment;return {initiative:point.name,effectiveImpact:point.impact,suggestedImpact:assessment?suggestImpact(assessment).score:null,mode:assessment?.mode??'manual',assumptions:selectedAssumptions(assessment).map(x=>`${x.field.label}: ${x.label}`)}}))
    clone.prepend(description)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', '1030'); clone.setAttribute('height', '535')
    clone.setAttribute('viewBox', `0 0 ${source.clientWidth || chartWidth} ${source.clientHeight || chartHeight}`)
    const content = new XMLSerializer().serializeToString(clone)
    const scaleName = mode === 'fit' ? 'Fit to Initiatives' : 'Full Scale'
    const footer = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="740"><rect width="1120" height="740" fill="#fff"/><text x="45" y="38" font-family="Arial" font-size="23" font-weight="700" fill="#17313b">AI Initiative Portfolio Explorer — ${scenarioNames[scenario]}</text><text x="45" y="62" font-family="Arial" font-size="13" fill="#5d6a72">${scaleName} · ${rangeLabel}${lockAxes ? ' · axes locked across scenarios' : ''}</text><text x="45" y="82" font-family="Arial" font-size="12" fill="#5d6a72">Business Impact (1–5) · Time to first meaningful value (months, faster is higher) · Bubble area: pilot investment (EUR)</text><g transform="translate(45,94)">${content}</g><circle cx="55" cy="654" r="6" fill="#40966e"/><text x="68" y="659" font-family="Arial" font-size="13" fill="#17313b">Low urgency</text><circle cx="178" cy="654" r="6" fill="#dfb542"/><text x="191" y="659" font-family="Arial" font-size="13" fill="#17313b">Moderate</text><circle cx="290" cy="654" r="6" fill="#e88b45"/><text x="303" y="659" font-family="Arial" font-size="13" fill="#17313b">High</text><circle cx="367" cy="654" r="6" fill="#cb5a5a"/><text x="380" y="659" font-family="Arial" font-size="13" fill="#17313b">Critical</text><circle cx="545" cy="654" r="7" fill="none" stroke="#8da4a0"/><circle cx="584" cy="654" r="17" fill="none" stroke="#8da4a0"/><text x="610" y="659" font-family="Arial" font-size="13" fill="#17313b">Bubble area = pilot investment (EUR); ${costScaleLabel} ${money(maxCost)}</text><text x="45" y="704" font-family="Arial" font-size="12" fill="#687b78">Axis zoom changes display only; assessed values remain unchanged. Impact categories are ordinal.</text><text x="45" y="724" font-family="Arial" font-size="12" fill="#7b858b">Illustrative data — not actual Accor performance or forecasts. Scenarios are planning assumptions.</text></svg>`
    download(`portfolio-chart-${scenario}.svg`, footer, 'image/svg+xml')
  }

  return <section className="chart-section" aria-label="Portfolio visualization">
    <div className="section-heading"><div><div className="eyebrow">PORTFOLIO MAP</div><h2>Opportunities at a glance</h2><p>Bubble area shows pilot investment. Color shows residual urgency.</p></div><div className="chart-header-actions">{controls}<button className="text-button" onClick={exportSvg}>Export chart SVG ↗</button></div></div>
    <div className="chart-range"><span>{mode === 'fit' ? 'FIT TO INITIATIVES' : 'FULL SCALE'}</span><span>{rangeLabel}</span>{lockAxes ? <span>Axes locked across scenarios</span> : null}</div>
    <div className="chart-frame" ref={ref}>
      <div className="chart-y-label">TIME TO VALUE · MONTHS <span>↑ faster</span></div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ScatterChart margin={{ top: 34, right: 24, bottom: 18, left: 0 }}>
          <CartesianGrid stroke="#e6ebe9" strokeDasharray="3 4" />
          <XAxis type="number" dataKey="impact" domain={bounds.x} allowDataOverflow padding={{ left: 60, right: 60 }} ticks={bounds.xTicks} tickLine={false} axisLine={{ stroke: '#aebbb8' }} tick={{ fontSize: 12, fill: '#5b6a70' }} />
          <YAxis type="number" dataKey="months" domain={[bounds.y[1], bounds.y[0]]} allowDataOverflow padding={{ top: 42, bottom: 42 }} ticks={bounds.yTicks} tickLine={false} axisLine={{ stroke: '#aebbb8' }} tick={{ fontSize: 12, fill: '#5b6a70' }} width={43} />
          <Tooltip cursor={{ stroke: '#99aaa9', strokeDasharray: '4 3' }} content={<ChartTooltip />} />
          <Scatter data={points} shape={(props: unknown) => { const p = props as { cx: number; cy: number; payload: Point }; return <Bubble {...p} selectedId={selectedId} onSelect={onSelect} maxCost={maxCost} label={layouts[p.payload?.id]} chartWidth={chartWidth} chartHeight={chartHeight} labels={labels} /> }} />
          {paths.map(({ key, s }) => <Scatter key={key} data={[{ impact: effectiveImpact(selected!,key), months: s.months }]} shape={(props: unknown) => { const p = props as { cx: number; cy: number }; return <g><circle cx={p.cx} cy={p.cy} r="5" fill="#17313b" stroke="white" strokeWidth="2"/><text x={p.cx + 9} y={p.cy - 9} fill="#17313b" fontSize="11">{scenarioNames[key]}</text></g> }} />)}
        </ScatterChart>
      </ResponsiveContainer>
      <div className="chart-x-label">BUSINESS IMPACT · EFFECTIVE RATING →</div>
      {!points.length ? <div className="chart-empty">No complete initiatives fit this display range. Complete an assessment or expand the full-scale month range.</div> : null}
    </div>
    <div className="chart-footer"><div className="urgency-legend"><b>Residual urgency</b>{(['Low', 'Moderate', 'High', 'Critical'] as Urgency[]).map(urgency => <span key={urgency}><i style={{ background: urgencyColors[urgency] }}/>{urgency}</span>)}</div><div className="size-legend"><span>Bubble area = pilot cost</span><i className="size-small"/><i className="size-large"/><span>{money(maxCost)} {costScaleLabel}</span></div></div>
    {allPoints.length > points.length ? <div className="chart-note">{allPoints.length - points.length} initiative(s) fall outside the chosen full-scale month range and remain in the portfolio.</div> : null}
    <div className="chart-note">Fitting the axes changes the view, not the assessed values. Impact categories are ordinal; equal spacing does not imply equal financial differences.</div>
  </section>
}
