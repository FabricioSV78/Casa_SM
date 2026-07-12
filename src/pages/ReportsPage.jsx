import {AlertCircle,Download,TrendingDown,TrendingUp,Wallet} from 'lucide-react'
import {Cell,Pie,PieChart,ResponsiveContainer,Tooltip} from 'recharts'
import {useApp} from '../context/AppContext'
import {PageHeader,StatCard} from '../components/ui'
import {money} from '../utils/format'

export default function ReportsPage(){
 const {movements,obligations}=useApp()
 const active=movements.filter(x=>x.estado==='activo')
 const income=active.filter(x=>x.tipo==='ingreso').reduce((sum,x)=>sum+Number(x.monto||0),0)
 const expense=active.filter(x=>x.tipo==='gasto').reduce((sum,x)=>sum+Number(x.monto||0),0)
 const debt=obligations.reduce((sum,x)=>sum+Number(x.saldoPendiente||0),0)
 const cats=Object.values(active.filter(x=>x.tipo==='gasto').reduce((acc,x)=>{
  acc[x.categoria]??={name:x.categoria||'Sin categoria',value:0}
  acc[x.categoria].value+=Number(x.monto||0)
  return acc
 },{}))

 const csv=()=>{
  const content=['Tipo,Fecha,Categoria,Concepto,Monto',...active.map(x=>[x.tipo,x.fechaMovimiento,x.categoria,`"${x.concepto}"`,x.monto].join(','))].join('\n')
  const link=document.createElement('a')
  link.href=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}))
  link.download='reporte-general.csv'
  link.click()
 }

 return <>
  <PageHeader title="Reportes" description="Resumen general para tomar decisiones" action={<button onClick={csv} className="btn-secondary"><Download size={18}/> Descargar CSV</button>}/>
  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
   <StatCard label="Ingresos acumulados" value={money(income)} icon={TrendingUp} color="green"/>
   <StatCard label="Gastos acumulados" value={money(expense)} icon={TrendingDown} color="red"/>
   <StatCard label="Flujo de caja" value={money(income-expense)} icon={Wallet} color="blue"/>
   <StatCard label="Deudas pendientes" value={money(debt)} icon={AlertCircle}/>
  </div>
  <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
   <section className="card min-w-0 p-3.5 sm:p-5">
    <h2 className="font-bold">Gastos por categoria</h2>
    <div className="h-64 min-w-0 sm:h-72">
     <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={cats} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} label>
      {cats.map((_,index)=><Cell key={index} fill={['#d9822b','#306f91','#c9574b','#18865f','#8366b3'][index%5]}/>)}
     </Pie><Tooltip formatter={money}/></PieChart></ResponsiveContainer>
    </div>
   </section>
   <section className="card p-3.5 sm:p-5">
    <h2 className="font-bold">Reportes disponibles</h2>
    <div className="mt-4 grid gap-3">
     {['Resumen mensual','Resumen anual','Ingresos por inquilino','Ingresos por espacio','Deudas pendientes','Adelantos registrados','Flujo de caja','Comparacion entre meses'].map(item=><div key={item} className="break-words rounded-xl border border-stone-200 p-3 font-medium sm:p-4">{item}<p className="mt-1 text-sm font-normal text-stone-500">Incluido en la estructura de la API</p></div>)}
    </div>
   </section>
  </div>
 </>
}
