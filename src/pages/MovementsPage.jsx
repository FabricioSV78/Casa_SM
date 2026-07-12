import {useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {Download,Plus,Search,Trash2} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {datePE,money} from '../utils/format'
import {Empty,PageHeader} from '../components/ui'

export default function MovementsPage(){
 const {movements,tenants,properties,removeMovement,isAdmin}=useApp()
 const [search,setSearch]=useState('')
 const [type,setType]=useState('todos')

 const rows=useMemo(()=>movements
  .filter(item=>item.estado==='activo')
  .filter(item=>type==='todos'||item.tipo===type)
  .filter(item=>`${item.concepto} ${item.categoria} ${tenants.find(tenant=>tenant.id===item.inquilinoId)?.nombre||''}`.toLowerCase().includes(search.toLowerCase()))
  .sort((a,b)=>b.fechaMovimiento.localeCompare(a.fechaMovimiento)),[movements,tenants,search,type])

 const download=()=>{
  const csv=['Fecha,Tipo,Concepto,Metodo,Monto',...rows.map(item=>[item.fechaMovimiento,item.tipo,`"${item.concepto}"`,item.metodoPago,item.monto].join(','))].join('\n')
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
  const link=document.createElement('a')
  link.href=url
  link.download='movimientos.csv'
  link.click()
  URL.revokeObjectURL(url)
 }

 const handleDelete=item=>{
  if(confirm('¿Eliminar este movimiento?'))removeMovement(item.id)
 }

 return <>
  <PageHeader
   title="Movimientos"
   description="Todos los ingresos y gastos registrados"
   action={isAdmin&&<Link className="btn-primary" to="/movimientos/nuevo"><Plus size={18}/> Nuevo</Link>}
  />

  <div className="card mb-5 grid min-w-0 gap-3 p-3.5 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:p-4">
   <label className="relative min-w-0">
    <Search className="absolute left-3 top-3.5 text-stone-400" size={19}/>
    <input className="field !pl-10" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar movimiento..."/>
   </label>
   <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:contents">
    <select aria-label="Filtrar por tipo" className="field min-w-0" value={type} onChange={event=>setType(event.target.value)}>
     <option value="todos">Todos</option>
     <option value="ingreso">Ingresos</option>
     <option value="gasto">Gastos</option>
    </select>
    <button className="btn-secondary !px-3" onClick={download} aria-label="Descargar movimientos en CSV"><Download size={18}/><span className="hidden min-[380px]:inline">CSV</span></button>
   </div>
  </div>

  {!rows.length?<Empty/>:<div className="card overflow-hidden">
   <div className="hidden overflow-x-auto md:block">
    <table className="w-full min-w-[760px] text-left">
     <thead className="bg-stone-50 text-sm text-stone-500"><tr>{['Fecha','Tipo','Persona / concepto','Espacio','Metodo','Monto',''].map(label=><th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
     <tbody className="divide-y divide-stone-100">{rows.map(item=>{
      const tenant=tenants.find(row=>row.id===item.inquilinoId)
      const property=properties.find(row=>row.id===item.propiedadId)
      return <tr key={item.id}>
       <td className="whitespace-nowrap px-4 py-4">{datePE(item.fechaMovimiento)}</td>
       <td className={`px-4 py-4 font-bold capitalize ${item.tipo==='ingreso'?'text-income':'text-expense'}`}>{item.tipo}</td>
       <td className="max-w-xs px-4 py-4"><b className="break-words">{tenant?.nombre||item.persona||'--'}</b><p className="break-words text-sm text-stone-500">{item.concepto}{item.periodosRelacionados&&` · ${item.periodosRelacionados}`}</p></td>
       <td className="px-4 py-4">{property?.codigo||'--'}</td>
       <td className="px-4 py-4">{item.metodoPago}</td>
       <td className={`whitespace-nowrap px-4 py-4 font-bold ${item.tipo==='ingreso'?'text-income':'text-expense'}`}>{money(item.monto)}</td>
       <td className="px-4 py-4">{isAdmin&&<button onClick={()=>handleDelete(item)} className="grid h-11 w-11 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${item.concepto}`}><Trash2 size={18}/></button>}</td>
      </tr>
     })}</tbody>
    </table>
   </div>

   <div className="divide-y divide-stone-100 md:hidden">{rows.map(item=>{
    const tenant=tenants.find(row=>row.id===item.inquilinoId)
    const property=properties.find(row=>row.id===item.propiedadId)
    return <article key={item.id} className="min-w-0 p-4">
     <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
       <p className="break-words font-bold">{item.concepto}</p>
       <p className="mt-0.5 break-words text-xs text-stone-500">{datePE(item.fechaMovimiento)} · {item.metodoPago}</p>
      </div>
      <b className={`shrink-0 whitespace-nowrap text-sm ${item.tipo==='ingreso'?'text-income':'text-expense'}`}>{item.tipo==='ingreso'?'+':'-'} {money(item.monto)}</b>
     </div>
     <div className="mt-3 flex min-w-0 items-end justify-between gap-3 border-t border-stone-100 pt-3">
      <div className="min-w-0 text-xs text-stone-500">
       <p className="break-words capitalize">{item.tipo}{tenant?.nombre?` · ${tenant.nombre}`:''}</p>
       {property&&<p className="mt-0.5 break-words">Espacio {property.codigo}</p>}
      </div>
      {isAdmin&&<button onClick={()=>handleDelete(item)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${item.concepto}`}><Trash2 size={18}/></button>}
     </div>
    </article>
   })}</div>
  </div>}
 </>
}
