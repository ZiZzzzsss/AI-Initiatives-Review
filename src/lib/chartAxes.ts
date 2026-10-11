import type { Initiative, ScenarioKey } from '../types'
import { isChartable, scenarioKeys } from './assessment'
import { effectiveImpact } from './impactGuide'
import { validationRating } from './economicValidation'

export type AxisMode = 'fit' | 'full'
export type AxisBounds = { x:[number,number]; y:[number,number]; xTicks:number[]; yTicks:number[]; fittedCount:number }

const fittedRange = (values:number[]):[number,number] => [
  Number(Math.max(1,Math.min(...values)-0.4).toFixed(1)),
  Number(Math.min(5,Math.max(...values)+0.4).toFixed(1)),
]

export function chartAxisBounds(items:Initiative[],scenario:ScenarioKey,mode:AxisMode,lockAcrossScenarios:boolean):AxisBounds {
  const keys=mode==='fit'&&lockAcrossScenarios?scenarioKeys:[scenario]
  const values=items.flatMap(item=>keys.filter(key=>isChartable(item,key)).map(key=>({impact:effectiveImpact(item,key)!,validation:validationRating(item,key)!})))
  const x=mode==='full'||!values.length?[1,5] as [number,number]:fittedRange(values.map(value=>value.impact))
  const y=mode==='full'||!values.length?[1,5] as [number,number]:fittedRange(values.map(value=>value.validation))
  return {x,y,xTicks:[1,2,3,4,5].filter(value=>value>=x[0]&&value<=x[1]),yTicks:[1,2,3,4,5].filter(value=>value>=y[0]&&value<=y[1]),fittedCount:values.length}
}

export const axisRangeLabel=(bounds:AxisBounds)=>`Visible range: impact ${bounds.x[0]}–${bounds.x[1]} / 5 · economic validation ${bounds.y[0]}–${bounds.y[1]} / 5`
