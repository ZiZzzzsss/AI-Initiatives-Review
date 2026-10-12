import type { Scenario } from '../types'
import { timelineHasEstimates, timelineHorizon, timelinePhases } from '../lib/delivery'

const displayMonth=(value:number|null)=>value===null?'Not estimated':`Month ${value}`

export default function DeliveryTimelineView({scenario}:{scenario:Scenario}){
  const timeline=scenario.timeline
  const horizon=timelineHorizon(scenario)
  const ticks=Array.from({length:5},(_,index)=>Number((index*horizon/4).toFixed(1)))
  return <div className="delivery-timeline" aria-label="Time-to-value breakdown">
    <div className="timeline-milestones">
      <div><span>Pilot completion</span><b>{displayMonth(timeline.pilotCompletion)}</b></div>
      <div><span>Decision-ready evidence</span><b>{displayMonth(timeline.evidenceReady)}</b></div>
      <div><span>First meaningful value</span><b>{displayMonth(scenario.months)}</b></div>
    </div>
    {timelineHasEstimates(timeline)?<>
      <div className="timeline-scale"><span/><div>{ticks.map((tick,index)=><span key={index}>{tick}</span>)}</div></div>
      <div className="timeline-rows">{timelinePhases.map(({key,label})=>{
        const phase=timeline.phases[key]
        return <div className="timeline-row" key={key}><span>{label}</span><div className="timeline-track">{phase.start!==null&&phase.duration!==null?<div className={`timeline-bar timeline-bar-${key}`} style={{left:`${100*phase.start/horizon}%`,width:`${Math.max(0.8,100*phase.duration/horizon)}%`}} title={`${label}: month ${phase.start}, ${phase.duration} month duration`}/>:null}</div></div>
      })}</div>
      <p className="timeline-note">Phases may overlap. Milestones are assessed separately and are not summed from phase durations.</p>
    </>:<p className="timeline-note">Phase timing has not been estimated. The chart uses the separately assessed first meaningful value milestone.</p>}
    {timeline.timingAssumptions?<p className="timeline-assumptions"><b>Timing assumptions:</b> {timeline.timingAssumptions}</p>:null}
  </div>
}
