import type { AxisBounds } from './chartAxes'

export type LabelPoint = { id: string; name: string; subtitle: string; impact: number; months: number; radius: number }
export type LabelLayout = { side: 'left' | 'right'; dy: number; displayName: string }
type Rect = { left: number; right: number; top: number; bottom: number }
const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
export const compactName = (name: string) => name === 'Automated CRM Data Enrichment' ? 'CRM Data Enrichment' : name.length > 29 ? `${name.slice(0, 27).trimEnd()}…` : name

export function placeChartLabels(points: LabelPoint[], bounds: AxisBounds, width: number, height: number): Record<string, LabelLayout> {
  const left = 90, right = width - 84, top = 73, bottom = height - 76
  const projected = points.map(point => ({ ...point,
    x: left + (point.impact - bounds.x[0]) / Math.max(0.1, bounds.x[1] - bounds.x[0]) * Math.max(1, right - left),
    y: top + (point.months - bounds.y[0]) / Math.max(0.1, bounds.y[1] - bounds.y[0]) * Math.max(1, bottom - top),
  }))
  const placed: Rect[] = []
  const result: Record<string, LabelLayout> = {}
  for (const point of projected) {
    const displayName = compactName(point.name)
    const labelWidth = Math.min(220, Math.max(displayName.length * 6.5, point.subtitle.length * 4.8))
    const preferred: ('left' | 'right')[] = point.x > width * 0.58 ? ['left', 'right'] : ['right', 'left']
    let best: { side: 'left' | 'right'; dy: number; score: number; box: Rect } | undefined
    for (const dy of [-3, -35, 29, -66, 60]) for (const side of preferred) {
      const anchor = point.x + (side === 'right' ? point.radius + 10 : -point.radius - 10)
      const box: Rect = { left: side === 'right' ? anchor : anchor - labelWidth, right: side === 'right' ? anchor + labelWidth : anchor, top: point.y + dy - 12, bottom: point.y + dy + 18 }
      const overflow = Math.max(0, 8 - box.left) + Math.max(0, box.right - (width - 8)) + Math.max(0, 48 - box.top) + Math.max(0, box.bottom - (height - 45))
      const bubbleOverlap = projected.filter(other => other.id !== point.id).reduce((sum, other) => sum + overlap(box, { left: other.x - other.radius - 4, right: other.x + other.radius + 4, top: other.y - other.radius - 4, bottom: other.y + other.radius + 4 }), 0)
      const labelOverlap = placed.reduce((sum, other) => sum + overlap(box, other), 0)
      const score = overflow * 30 + bubbleOverlap * 2 + labelOverlap * 3 + Math.abs(dy) * 0.05 + (side !== preferred[0] ? 0.2 : 0)
      if (!best || score < best.score) best = { side, dy, score, box }
    }
    if (best) { result[point.id] = { side: best.side, dy: best.dy, displayName }; placed.push(best.box) }
  }
  return result
}
