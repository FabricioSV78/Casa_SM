const configuredBalance=Number(import.meta.env.VITE_INITIAL_ACCOUNT_BALANCE)

export const INITIAL_ACCOUNT_BALANCE=Number.isFinite(configuredBalance)?configuredBalance:9400.78

export function getAccountBalance(movements=[]){
 return movements
  .filter(item=>item.estado==='activo')
  .reduce((sum,item)=>sum+(item.tipo==='ingreso'?Number(item.monto||0):-Number(item.monto||0)),INITIAL_ACCOUNT_BALANCE)
}
