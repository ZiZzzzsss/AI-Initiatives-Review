import { describe, expect, it } from 'vitest'
import { chartAxisBounds } from './chartAxes'
import { compactName, placeChartLabels } from './chartLabels'
import { demoPortfolio } from './data'

describe('chart display ranges', () => {
  it('fits the visible scenario with rating padding and rounded months', () => {
    const items = demoPortfolio().initiatives
    const bounds = chartAxisBounds(items, 'base', 'fit', false, [0, 18])
    expect(bounds.x).toEqual([2.6, 5])
    expect(bounds.y[1]).toBeLessThan(18)
    expect(bounds.y[0]).toBeLessThan(3)
    expect(bounds.y[1]).toBeGreaterThan(10)
    expect(bounds.xTicks).toEqual([3, 4, 5])
    expect(bounds.yTicks).toEqual([...bounds.yTicks].sort((a, b) => a - b))
  })
  it('keeps a common fitted range across scenario switches when locked', () => {
    const items = demoPortfolio().initiatives
    const base = chartAxisBounds(items, 'base', 'fit', true, [0, 18])
    const downside = chartAxisBounds(items, 'conservative', 'fit', true, [0, 18])
    const upside = chartAxisBounds(items, 'optimistic', 'fit', true, [0, 18])
    expect(downside).toEqual(base)
    expect(upside).toEqual(base)
    expect(chartAxisBounds(items, 'optimistic', 'fit', false, [0, 18]).y).not.toEqual(base.y)
  })
  it('uses the full 1–5 rating scale and configured month range in Full Scale', () => {
    const bounds = chartAxisBounds(demoPortfolio().initiatives, 'base', 'full', false, [0, 24])
    expect(bounds.x).toEqual([1, 5])
    expect(bounds.y).toEqual([0, 24])
  })
  it('gives identical values visible padded ranges without modifying assessments', () => {
    const items = demoPortfolio().initiatives
    const original = items[0].scenarios.base
    for (const item of items) { item.scenarios.base.impact = 3; item.scenarios.base.months = 6 }
    const bounds = chartAxisBounds(items, 'base', 'fit', false, [0, 18])
    expect(bounds.x[0]).toBeLessThan(3)
    expect(bounds.x[1]).toBeGreaterThan(3)
    expect(bounds.y[0]).toBeLessThan(6)
    expect(bounds.y[1]).toBeGreaterThan(6)
    expect(original.pilotCost).toBe(35000)
  })
  it('retains readable compact names and chooses separate label placements', () => {
    const bounds = chartAxisBounds(demoPortfolio().initiatives, 'base', 'fit', false, [0, 18])
    const labels = placeChartLabels([
      {id:'a',name:'Automated CRM Data Enrichment',archetype:'Strategic Enabler',impact:4,months:6,radius:23},
      {id:'b',name:'Predictive Pricing',archetype:'Revenue & Margin Optimizer',impact:5,months:10,radius:34},
    ], bounds, 700, 490)
    expect(compactName('Automated CRM Data Enrichment')).toBe('CRM Data Enrichment')
    expect(labels.a.displayName).toBe('CRM Data Enrichment')
    expect(labels.b.side).toBe('left')
  })
})
