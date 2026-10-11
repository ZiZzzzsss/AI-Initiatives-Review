import type { Initiative, Portfolio } from '../types'
export const upsertInitiative=(portfolio:Portfolio,item:Initiative):Portfolio=>({...portfolio,initiatives:portfolio.initiatives.some(i=>i.id===item.id)?portfolio.initiatives.map(i=>i.id===item.id?item:i):[...portfolio.initiatives,item]})
export const deleteInitiative=(portfolio:Portfolio,id:string):Portfolio=>({...portfolio,initiatives:portfolio.initiatives.filter(i=>i.id!==id)})
