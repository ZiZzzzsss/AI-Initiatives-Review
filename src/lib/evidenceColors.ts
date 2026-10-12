export const evidenceBands = [
  { label:'0–3 months', color:'#319482' },
  { label:'>3–6 months', color:'#4e86bd' },
  { label:'>6 months', color:'#73649e' },
] as const
export const unassessedEvidenceColor = '#9ba9ad'
export const evidenceColor = (months:number|null) => months===null?unassessedEvidenceColor:months<=3?evidenceBands[0].color:months<=6?evidenceBands[1].color:evidenceBands[2].color
