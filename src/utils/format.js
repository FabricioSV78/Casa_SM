export const money = (n=0) => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(n))
export const datePE = value => new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value))
export const monthName = (month,year) => new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric'}).format(new Date(year,month-1,1))
export const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`
