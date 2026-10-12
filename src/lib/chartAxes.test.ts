import { describe, expect, it } from 'vitest'
import { chartAxisBounds } from './chartAxes'
import { coincidentOffsets, compactName, placeChartLabels } from './chartLabels'
import { demoPortfolio } from './data'

describe('economic validation chart ranges', () => {
  it('fits both 1–5 rating axes around the visible scenario', () => {
    const bounds=chartAxisBounds(demoPortfolio().initiatives,'base','fit',false)
    expect(bounds.x).toEqual([2.6,4.4])
    expect(bounds.y).toEqual([1.6,3.4])
    expect(bounds.xTicks).toEqual([3,4])
    expect(bounds.yTicks).toEqual([2,3])
  })
  it('locks rating axes across scenarios and supports full 1–5 scale', () => {
    const items=demoPortfolio().initiatives
    expect(chartAxisBounds(items,'base','fit',true)).toEqual(chartAxisBounds(items,'optimistic','fit',true))
    expect(chartAxisBounds(items,'base','full',false).y).toEqual([1,5])
  })
  it('moves higher validation ratings upward without changing impact', () => {
    const items=demoPortfolio().initiatives
    items[0].scenarios.base.economicValidation!.rating=5
    const bounds=chartAxisBounds(items,'base','fit',false)
    expect(bounds.y[1]).toBeGreaterThan(4)
    expect(bounds.x).toEqual([2.6,4.4])
  })
  it('retains compact names and places labels with takeaway width', () => {
    const bounds=chartAxisBounds(demoPortfolio().initiatives,'base','fit',false)
    const labels=placeChartLabels([
      {id:'a',name:'Automated CRM Data Enrichment',subtitle:'Intermediate cost and evidence',impact:3,validation:3,radius:23},
      {id:'b',name:'Predictive Pricing',subtitle:'High impact, larger commitment',impact:4,validation:3,radius:34},
    ],bounds,700,490)
    expect(compactName('Automated CRM Data Enrichment')).toBe('CRM Data Enrichment')
    expect(labels.a.displayName).toBe('CRM Data Enrichment')
    expect(labels.b.displayName).toBe('Predictive Pricing')
  })
  it('separates coincident bubbles while retaining their assessed coordinates',()=>{
    const points=[{id:'crm',impact:4,validation:3,radius:22},{id:'pricing',impact:4,validation:3,radius:34}]
    const offsets=coincidentOffsets(points)
    expect(offsets.crm).toBeLessThan(0)
    expect(offsets.pricing).toBeGreaterThan(0)
    expect(offsets.pricing-offsets.crm).toBeGreaterThan(56)
    expect(points.every(point=>point.impact===4&&point.validation===3)).toBe(true)
  })
})
