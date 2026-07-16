import {useEffect,useMemo,useState} from 'react'
import {useForm} from 'react-hook-form'
import {useNavigate,useSearchParams} from 'react-router-dom'
import {ArrowLeft,Check,Save} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {Field,PageHeader} from '../components/ui'
import {expenseCategories,paymentMethods} from '../constants/options'

const propertyIdsOf=tenant=>[...new Set([...(tenant?.propiedadIds||[]),tenant?.propiedadId].filter(Boolean))]

export default function MovementFormPage(){
 const {addMovement,tenants,properties,isAdmin}=useApp()
 const navigate=useNavigate()
 const [params]=useSearchParams()
 const [selectedPropertyIds,setSelectedPropertyIds]=useState([])
 const [propertyError,setPropertyError]=useState('')
 const {register,handleSubmit,watch,formState:{errors,isSubmitting}}=useForm({
  defaultValues:{
   tipo:params.get('tipo')||'ingreso',
   fechaMovimiento:new Date().toISOString().slice(0,10),
   metodoPago:'Efectivo',
   categoria:'Alquiler',
   tipoPago:'mensualidad',
   inquilinoId:''
  }
 })
 const tipo=watch('tipo')
 const tenantId=watch('inquilinoId')
 const availableTenants=tenants.filter(item=>item.estado==='activo')
 const availableProperties=properties.filter(item=>item.estado!=='eliminado')
 const selectedTenant=availableTenants.find(item=>item.id===tenantId)
 const assignedProperties=useMemo(()=>{
  const assignedIds=propertyIdsOf(selectedTenant)
  return availableProperties.filter(property=>assignedIds.includes(property.id))
 },[selectedTenant,availableProperties])

 useEffect(()=>{
  setPropertyError('')
  if(tipo==='ingreso'){
   setSelectedPropertyIds(propertyIdsOf(selectedTenant))
  }else{
   setSelectedPropertyIds([])
  }
 },[tenantId,tipo])

 if(!isAdmin)return <div className="card p-6 text-center sm:p-8">Su perfil es solo de lectura.</div>

 const submit=async data=>{
  if(data.tipo==='ingreso'&&assignedProperties.length&&!selectedPropertyIds.length){
   setPropertyError('Seleccione al menos un espacio')
   return
  }
  await addMovement({...data,propiedadIds:selectedPropertyIds,propiedadId:selectedPropertyIds[0]||null})
  navigate('/movimientos')
 }

 const toggleProperty=id=>{
  setPropertyError('')
  setSelectedPropertyIds(ids=>ids.includes(id)?ids.filter(item=>item!==id):[...ids,id])
 }

 return <>
  <button onClick={()=>navigate(-1)} className="mb-4 flex min-h-11 items-center gap-2 text-sm font-semibold text-stone-600"><ArrowLeft size={18}/> Volver</button>
  <PageHeader title="Registrar movimiento" description="Elija ingreso o gasto y complete la informacion"/>
  <form onSubmit={handleSubmit(submit)} className="card p-4 min-[380px]:p-5 sm:p-7">
   <div className="mb-5 grid grid-cols-2 gap-2 min-[380px]:gap-3 sm:mb-6">
    {['ingreso','gasto'].map(item=><label key={item} className={`cursor-pointer rounded-lg border px-2 py-3.5 text-center font-bold capitalize sm:p-4 ${tipo===item?(item==='ingreso'?'border-emerald-500 bg-emerald-50 text-emerald-800':'border-red-400 bg-red-50 text-red-700'):'border-stone-200'}`}>
     <input type="radio" value={item} {...register('tipo')} className="sr-only"/>{item}
    </label>)}
   </div>

   <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
    <Field label={tipo==='ingreso'?'Fecha de recepcion':'Fecha del gasto'} error={errors.fechaMovimiento}><input type="date" className="field" {...register('fechaMovimiento',{required:'Indique la fecha'})}/></Field>
    <Field label="Monto (S/)" error={errors.monto}><input type="number" min="0.01" step="0.01" inputMode="decimal" className="field" placeholder="0.00" {...register('monto',{required:'Ingrese el monto',min:{value:.01,message:'El monto debe ser mayor a cero'}})}/></Field>

    {tipo==='ingreso'?<>
     <Field label="Inquilino o empresa" error={errors.inquilinoId}><select className="field" {...register('inquilinoId',{required:'Seleccione quien realizo el pago'})}><option value="">Seleccione</option>{availableTenants.map(item=><option key={item.id} value={item.id}>{item.nombre}</option>)}</select></Field>
     <Field label="Tipo de pago"><select className="field" {...register('tipoPago')}>{['mensualidad','pago parcial','deuda atrasada','adelanto','garantia','servicio','otro'].map(item=><option key={item}>{item}</option>)}</select></Field>
     <Field label="Periodo(s) a los que corresponde"><input className="field" placeholder="Ej. enero y febrero 2026" {...register('periodosRelacionados')}/></Field>
    </>:<Field label="Categoria"><select className="field" {...register('categoria')}>{expenseCategories.map(item=><option key={item}>{item}</option>)}</select></Field>}

    <div className={tipo==='ingreso'&&selectedTenant?.tipo==='empresa'?'sm:col-span-2':''}>
     {tipo==='ingreso'?<IncomePropertyPicker
      tenant={selectedTenant}
      properties={assignedProperties}
      selectedIds={selectedPropertyIds}
      error={propertyError}
      onToggle={toggleProperty}
      onSelectAll={()=>setSelectedPropertyIds(assignedProperties.map(item=>item.id))}
     />:<Field label="Espacio relacionado">
      <select className="field" value={selectedPropertyIds[0]||''} onChange={event=>setSelectedPropertyIds(event.target.value?[event.target.value]:[])}>
       <option value="">Ninguno</option>
       {availableProperties.map(item=><option key={item.id} value={item.id}>{item.codigo} - {item.nombre||item.tipo}</option>)}
      </select>
     </Field>}
    </div>

    <Field label="Metodo de pago"><select className="field" {...register('metodoPago')}>{paymentMethods.map(item=><option key={item}>{item}</option>)}</select></Field>
    <Field label="Concepto" error={errors.concepto}><input className="field" placeholder="Descripcion breve" {...register('concepto',{required:'Escriba el concepto'})}/></Field>
    <div className="sm:col-span-2"><Field label="Observaciones"><textarea rows="3" className="field resize-none" {...register('observaciones')}/></Field></div>
   </div>

   <div className="mt-6 flex flex-col-reverse gap-3 sm:mt-7 sm:flex-row sm:justify-end">
    <button type="button" onClick={()=>navigate(-1)} className="btn-secondary w-full sm:w-auto">Cancelar</button>
    <button disabled={isSubmitting} className="btn-primary w-full sm:w-auto"><Save size={18}/> {isSubmitting?'Guardando...':'Guardar movimiento'}</button>
   </div>
  </form>
 </>
}

function IncomePropertyPicker({tenant,properties,selectedIds,error,onToggle,onSelectAll}){
 if(!tenant)return <Field label="Espacio relacionado"><div className="flex min-h-12 items-center rounded-lg border border-dashed border-stone-300 px-3 text-sm text-stone-500">Seleccione primero un inquilino o empresa.</div></Field>
 if(!properties.length)return <Field label="Espacio relacionado"><div className="flex min-h-12 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm text-amber-800">Este inquilino no tiene espacios asignados.</div></Field>
 if(tenant.tipo!=='empresa'){
  const property=properties[0]
  return <Field label="Espacio relacionado"><div className="flex min-h-12 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 font-medium">{property.codigo} - {property.nombre||property.tipo}</div></Field>
 }

 const allSelected=properties.every(property=>selectedIds.includes(property.id))
 return <fieldset>
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
   <legend className="label !mb-0">Espacios relacionados</legend>
   <button type="button" onClick={onSelectAll} disabled={allSelected} className="text-sm font-semibold text-brand-700 disabled:text-stone-400">Seleccionar todos</button>
  </div>
  <div className="grid gap-2 sm:grid-cols-2">
   {properties.map(property=>{
    const selected=selectedIds.includes(property.id)
    return <label key={property.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-3 ${selected?'border-brand-500 bg-brand-50':'border-stone-200 bg-white'}`}>
     <input type="checkbox" className="sr-only" checked={selected} onChange={()=>onToggle(property.id)}/>
     <span className={`grid h-6 w-6 shrink-0 place-items-center rounded border ${selected?'border-brand-600 bg-brand-600 text-white':'border-stone-300'}`}>{selected&&<Check size={16}/>}</span>
     <span className="min-w-0"><b className="block break-words text-sm">{property.codigo}</b><span className="block break-words text-xs text-stone-500">{property.nombre||property.ubicacion}</span></span>
    </label>
   })}
  </div>
  {error&&<span className="mt-1 block text-sm text-red-600">{error}</span>}
 </fieldset>
}
