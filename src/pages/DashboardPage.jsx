import {useMemo,useState} from 'react'
import {Building2,Plus,Receipt,TrendingDown,TrendingUp,Wallet} from 'lucide-react'
import {Area,AreaChart,Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts'
import {Link} from 'react-router-dom'
import {useApp} from '../context/AppContext'
import {getAccountBalance} from '../constants/account'
import {datePE,money,monthName} from '../utils/format'
import {Empty,PageHeader,StatCard} from '../components/ui'

const now=new Date()

export default function DashboardPage(){
 const {movements,properties,isAdmin}=useApp()
 const [month,setMonth]=useState(now.getMonth()+1)
 const [year,setYear]=useState(now.getFullYear())

 const filtered=useMemo(()=>movements.filter(x=>{
  if(x.estado!=='activo'||!x.fechaMovimiento)return false
  const date=new Date(`${x.fechaMovimiento}T12:00:00`)
  return date.getMonth()+1===Number(month)&&date.getFullYear()===Number(year)
 }),[movements,month,year])

 const income=filtered.filter(x=>x.tipo==='ingreso').reduce((sum,x)=>sum+Number(x.monto||0),0)
 const expense=filtered.filter(x=>x.tipo==='gasto').reduce((sum,x)=>sum+Number(x.monto||0),0)
 const totalBalance=getAccountBalance(movements)

 const daily=Object.values(filtered.reduce((acc,x)=>{
  const day=Number(String(x.fechaMovimiento).slice(-2))
  acc[day]??={dia:day,ingresos:0,gastos:0}
  acc[day][x.tipo==='ingreso'?'ingresos':'gastos']+=Number(x.monto||0)
  return acc
 },{}))

 const six=Array.from({length:6},(_,index)=>{
  const date=new Date(Number(year),Number(month)-1-(5-index),1)
  const mm=date.getMonth()+1
  const yy=date.getFullYear()
  const rows=movements.filter(x=>{
   if(x.estado!=='activo'||!x.fechaMovimiento)return false
   const movementDate=new Date(`${x.fechaMovimiento}T12:00:00`)
   return movementDate.getMonth()+1===mm&&movementDate.getFullYear()===yy
  })

  return {
   mes:date.toLocaleDateString('es-PE',{month:'short'}),
   ingresos:rows.filter(x=>x.tipo==='ingreso').reduce((sum,x)=>sum+Number(x.monto||0),0),
   gastos:rows.filter(x=>x.tipo==='gasto').reduce((sum,x)=>sum+Number(x.monto||0),0)
  }
 })

 return <>
  <PageHeader
   title="Resumen del negocio"
   description={`Resultados de ${monthName(month,year)}`}
   action={<div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)] gap-2 sm:flex sm:w-auto">
    <select aria-label="Mes" className="field !py-2" value={month} onChange={event=>setMonth(event.target.value)}>
     {Array.from({length:12},(_,index)=><option key={index} value={index+1}>{new Date(2024,index).toLocaleDateString('es-PE',{month:'long'})}</option>)}
    </select>
    <select aria-label="Ano" className="field !py-2" value={year} onChange={event=>setYear(event.target.value)}>
     {[now.getFullYear(),now.getFullYear()-1,now.getFullYear()-2].map(item=><option key={item}>{item}</option>)}
    </select>
   </div>}
  />

  {isAdmin&&<div className="mb-5 grid grid-cols-2 gap-2 min-[380px]:gap-3 sm:hidden">
   <Link to="/movimientos/nuevo?tipo=ingreso" className="btn-primary !px-2"><Plus size={18}/> Ingreso</Link>
   <Link to="/movimientos/nuevo?tipo=gasto" className="btn-secondary !px-2"><Plus size={18}/> Gasto</Link>
  </div>}

  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
   <StatCard label="Ingresos del mes" value={money(income)} icon={TrendingUp} color="green"/>
   <StatCard label="Gastos del mes" value={money(expense)} icon={TrendingDown} color="red"/>
   <StatCard label="Saldo del mes" value={money(income-expense)} icon={Wallet} color="blue"/>
   <StatCard label="Disponible acumulado" value={money(totalBalance)} icon={Wallet} color="violet"/>
   <StatCard label="Movimientos" value={filtered.length} icon={Receipt}/>
   <StatCard label="Espacios ocupados" value={`${properties.filter(x=>x.estado==='ocupada').length} de ${properties.length}`} icon={Building2} color="green"/>
  </div>

  <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
   <section className="card p-3.5 sm:p-5">
    <h2 className="font-bold">Ingresos y gastos por dia</h2>
    <p className="text-sm text-stone-500">Movimientos reales del mes</p>
    <div className="mt-4 h-60 min-w-0 sm:mt-5 sm:h-64">
     <ResponsiveContainer width="100%" height="100%"><AreaChart data={daily} margin={{top:5,right:4,left:-22,bottom:0}}>
      <XAxis dataKey="dia"/>
      <YAxis/>
      <Tooltip formatter={money}/>
      <Area type="monotone" dataKey="ingresos" stroke="#18865f" fill="#d1fae5"/>
      <Area type="monotone" dataKey="gastos" stroke="#c9574b" fill="#fee2e2"/>
     </AreaChart></ResponsiveContainer>
    </div>
   </section>
   <section className="card p-3.5 sm:p-5">
    <h2 className="font-bold">Ultimos seis meses</h2>
    <p className="text-sm text-stone-500">Comparacion de flujo de caja</p>
    <div className="mt-4 h-60 min-w-0 sm:mt-5 sm:h-64">
     <ResponsiveContainer width="100%" height="100%"><BarChart data={six} margin={{top:5,right:4,left:-22,bottom:0}}>
      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
      <XAxis dataKey="mes"/>
      <YAxis/>
      <Tooltip formatter={money}/>
      <Bar dataKey="ingresos" fill="#18865f" radius={[5,5,0,0]}/>
      <Bar dataKey="gastos" fill="#c9574b" radius={[5,5,0,0]}/>
     </BarChart></ResponsiveContainer>
    </div>
   </section>
  </div>

  <div className="mt-6">
   <section className="card overflow-hidden">
    <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
     <h2 className="font-bold">Ultimos movimientos</h2>
     <Link to="/movimientos" className="text-sm font-semibold text-brand-700">Ver todos</Link>
    </div>
    {!filtered.length?<div className="p-5"><Empty title="Sin movimientos este mes" text="Los ingresos y gastos apareceran aqui."/></div>:<div className="divide-y divide-stone-100">
     {filtered.slice(-5).reverse().map(item=><div key={item.id} className="flex min-w-0 items-start justify-between gap-3 px-4 py-4 sm:items-center sm:px-5">
      <div className="min-w-0"><p className="break-words font-semibold">{item.concepto}</p><p className="break-words text-xs text-stone-500 sm:text-sm">{datePE(item.fechaMovimiento)} · {item.metodoPago}</p></div>
      <b className={`shrink-0 whitespace-nowrap text-sm sm:text-base ${item.tipo==='ingreso'?'text-income':'text-expense'}`}>{item.tipo==='ingreso'?'+':'-'} {money(item.monto)}</b>
     </div>)}
    </div>}
   </section>
  </div>
 </>
}
