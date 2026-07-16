import {useEffect,useState} from 'react'
import {Building2,CalendarDays,Check,Phone,Plus,Receipt,SquarePen,Trash2} from 'lucide-react'
import {useForm} from 'react-hook-form'
import {useApp} from '../context/AppContext'
import {Badge,Empty,Field,Modal,PageHeader} from '../components/ui'
import {datePE,money} from '../utils/format'

const propertyIdsOf=tenant=>[...new Set([...(tenant?.propiedadIds||[]),tenant?.propiedadId].filter(Boolean))]

export default function TenantsPage(){
 const {tenants,properties,movements,addTenant,editTenant,removeTenant,isAdmin}=useApp()
 const [selected,setSelected]=useState(null)
 const [formTenant,setFormTenant]=useState(undefined)
 const activeTenants=tenants.filter(item=>item.estado==='activo').length
 const visibleTenants=tenants.filter(item=>item.estado!=='eliminado')

 const save=async data=>{
  const saved=data.id?await editTenant(data):await addTenant(data)
  setSelected(current=>current?.id===saved.id?saved:current)
  setFormTenant(undefined)
 }

 return <>
  <PageHeader
   title="Inquilinos y empresas"
   description={`${activeTenants} contratos activos`}
   action={isAdmin&&<button className="btn-primary" onClick={()=>setFormTenant(null)}><Plus size={18}/> Agregar</button>}
  />

  <TenantDirectory tenants={visibleTenants} properties={properties} onSelect={setSelected}/>

  {selected&&<TenantDetail
   tenant={selected}
   properties={properties.filter(property=>propertyIdsOf(selected).includes(property.id))}
   movements={movements.filter(item=>item.inquilinoId===selected.id&&item.estado!=='eliminado')}
   isAdmin={isAdmin}
   onEdit={()=>setFormTenant(selected)}
   onDelete={async()=>{
    const spaces=propertyIdsOf(selected).length
    if(!confirm(`Eliminar a ${selected.nombre}? ${spaces?`Se liberaran ${spaces} espacio(s) asignado(s).`:''}`))return
    await removeTenant(selected)
    setSelected(null)
   }}
   onClose={()=>setSelected(null)}
  />}

  {formTenant!==undefined&&<TenantFormModal
   tenant={formTenant}
   properties={properties}
   onSave={save}
   onClose={()=>setFormTenant(undefined)}
  />}
 </>
}

function TenantFormModal({tenant,properties,onSave,onClose}){
 const initialIds=propertyIdsOf(tenant)
 const [selectedIds,setSelectedIds]=useState(initialIds)
 const {register,handleSubmit,watch,formState:{errors,isSubmitting}}=useForm({
  defaultValues:{
   nombre:tenant?.nombre||'',
   tipo:tenant?.tipo||'persona',
   documento:tenant?.documento||'',
   celular:tenant?.celular||'',
   correo:tenant?.correo||'',
   fechaInicio:tenant?.fechaInicio||'',
   precioMensual:tenant?.precioMensual??'',
   diaPago:tenant?.diaPago??'',
   garantia:tenant?.garantia??'',
   observaciones:tenant?.observaciones||''
  }
 })
 const type=watch('tipo')
 const selectableProperties=properties.filter(property=>
  property.estado!=='eliminado'&&(
   property.estado==='disponible'||
   property.inquilinoActualId===tenant?.id||
   initialIds.includes(property.id)
  )
 )

 useEffect(()=>{
  if(type==='persona'&&selectedIds.length>1)setSelectedIds(ids=>ids.slice(0,1))
 },[type,selectedIds.length])

 const toggleProperty=id=>{
  setSelectedIds(ids=>ids.includes(id)?ids.filter(item=>item!==id):[...ids,id])
 }

 const submit=data=>onSave({
  ...data,
  id:tenant?.id,
  propiedadIds:type==='empresa'?selectedIds:selectedIds.slice(0,1)
 })

 return <Modal title={tenant?'Editar inquilino':'Nuevo inquilino'} onClose={onClose}>
  <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
   <Field label="Nombre o razon social" error={errors.nombre}><input className="field" {...register('nombre',{required:'Ingrese el nombre'})}/></Field>
   <Field label="Tipo"><select className="field" {...register('tipo')}><option value="persona">Persona</option><option value="empresa">Empresa</option></select></Field>
   <Field label="DNI o RUC"><input className="field" {...register('documento')}/></Field>
   <Field label="Celular"><input className="field" {...register('celular')}/></Field>
   <Field label="Correo"><input type="email" className="field" {...register('correo')}/></Field>
   <Field label="Inicio"><input type="date" className="field" {...register('fechaInicio')}/></Field>

   <div className="sm:col-span-2">
    {type==='empresa'?<CompanyPropertyPicker properties={selectableProperties} selectedIds={selectedIds} onToggle={toggleProperty}/>:<Field label="Espacio asignado">
     <select className="field" value={selectedIds[0]||''} onChange={event=>setSelectedIds(event.target.value?[event.target.value]:[])}>
      <option value="">Sin asignar</option>
      {selectableProperties.map(property=><option key={property.id} value={property.id}>{property.codigo} - {property.nombre||property.tipo}</option>)}
     </select>
    </Field>}
   </div>

   <Field label="Precio mensual" error={errors.precioMensual}><input type="number" min="0" step="0.01" inputMode="decimal" className="field" {...register('precioMensual',{required:'Ingrese el precio',valueAsNumber:true})}/></Field>
   <Field label="Dia de pago"><input type="number" min="1" max="31" inputMode="numeric" className="field" {...register('diaPago',{valueAsNumber:true})}/></Field>
   <Field label="Garantia"><input type="number" min="0" step="0.01" inputMode="decimal" className="field" {...register('garantia',{valueAsNumber:true})}/></Field>
   <div className="sm:col-span-2"><Field label="Observaciones"><textarea rows="3" className="field resize-none" {...register('observaciones')}/></Field></div>
   <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
    <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">Cancelar</button>
    <button disabled={isSubmitting} className="btn-primary w-full sm:w-auto">{isSubmitting?'Guardando...':tenant?'Guardar cambios':'Guardar inquilino'}</button>
   </div>
  </form>
 </Modal>
}

function CompanyPropertyPicker({properties,selectedIds,onToggle}){
 return <fieldset>
  <legend className="label">Espacios asignados</legend>
  {!properties.length?<p className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">No hay espacios disponibles.</p>:<div className="grid gap-2 sm:grid-cols-2">
   {properties.map(property=>{
    const selected=selectedIds.includes(property.id)
    return <label key={property.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${selected?'border-brand-500 bg-brand-50':'border-stone-200 bg-white hover:border-stone-300'}`}>
     <input type="checkbox" className="sr-only" checked={selected} onChange={()=>onToggle(property.id)}/>
     <span className={`grid h-6 w-6 shrink-0 place-items-center rounded border ${selected?'border-brand-600 bg-brand-600 text-white':'border-stone-300'}`}>{selected&&<Check size={16}/>}</span>
     <span className="min-w-0"><b className="block break-words text-sm">{property.codigo}</b><span className="block break-words text-xs text-stone-500">{property.nombre||property.ubicacion||'Sin nombre'}</span></span>
    </label>
   })}
  </div>}
  <p className="mt-2 text-xs text-stone-500">{selectedIds.length} espacio(s) seleccionado(s)</p>
 </fieldset>
}

function TenantDirectory({tenants,properties,onSelect}){
 if(!tenants.length)return <Empty title="No hay inquilinos" text="Agregue el primer contrato para verlo aqui."/>

 return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
  {tenants.map(tenant=>{
   const assigned=properties.filter(property=>propertyIdsOf(tenant).includes(property.id))
   const propertyLabel=assigned.length?assigned.map(property=>property.codigo).join(', '):'Sin espacio'
   return <button key={tenant.id} onClick={()=>onSelect(tenant)} className="card min-w-0 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 sm:p-5">
    <div className="flex items-start justify-between gap-3">
     <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-100 font-bold text-brand-700">{initials(tenant.nombre)}</div>
     <Badge status={tenant.estado||'activo'}/>
    </div>
    <h2 className="mt-4 break-words text-lg font-bold">{tenant.nombre}</h2>
    <p className="break-words text-sm capitalize text-stone-500">{tenant.tipo||'persona'} - {propertyLabel}</p>
    <div className="mt-4 grid gap-3 border-t pt-4">
     <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-stone-500">Mensualidad</span><b>{money(tenant.precioMensual)}</b></div>
     <div className="flex items-center justify-between"><span className="text-sm text-stone-500">Dia de pago</span><b>{tenant.diaPago||'--'}</b></div>
    </div>
   </button>
  })}
 </div>
}

function TenantDetail({tenant,properties,movements,isAdmin,onEdit,onDelete,onClose}){
 const propertyNames=properties.length?properties.map(property=>`${property.codigo}${property.nombre?` - ${property.nombre}`:''}`).join(', '):'Sin espacio'
 return <Modal title="Detalle del inquilino" onClose={onClose}>
  <div className="rounded-lg bg-white p-4 sm:p-5">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0"><h3 className="break-words text-lg font-bold sm:text-xl">{tenant.nombre}</h3><p className="break-words text-sm text-stone-500 sm:text-base">{tenant.documento||'Sin documento'}</p></div>
    <Badge status={tenant.estado||'activo'}/>
   </div>
   <div className="mt-5 grid gap-4 sm:grid-cols-2">
    <Info icon={Phone} label="Celular" value={tenant.celular}/>
    <Info icon={Building2} label={properties.length===1?'Espacio':'Espacios'} value={propertyNames}/>
    <Info label="Precio mensual" value={money(tenant.precioMensual)}/>
    <Info icon={CalendarDays} label="Dia de pago" value={tenant.diaPago?`Dia ${tenant.diaPago}`:'Sin definir'}/>
    <Info label="Inicio del alquiler" value={tenant.fechaInicio?datePE(tenant.fechaInicio):'Sin fecha'}/>
    <Info label="Garantia" value={money(tenant.garantia)}/>
   </div>
  </div>

  {isAdmin&&<div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
   <button type="button" onClick={onDelete} className="btn-secondary w-full text-red-700 hover:bg-red-50 hover:text-red-800 sm:w-auto"><Trash2 size={18}/> Eliminar</button>
   <button type="button" onClick={onEdit} className="btn-primary w-full sm:w-auto"><SquarePen size={18}/> Editar</button>
  </div>}

  <h3 className="mb-3 mt-6 flex items-center gap-2 font-bold"><Receipt size={18}/> Movimientos asociados</h3>
  {!movements.length?<Empty title="Sin movimientos registrados" text="Los movimientos asociados a este inquilino apareceran aqui."/>:<div className="space-y-2">{movements.map(item=><div key={item.id} className="flex min-w-0 flex-col gap-1 rounded-lg bg-white p-3 min-[380px]:flex-row min-[380px]:justify-between min-[380px]:gap-3"><span className="min-w-0 break-words text-sm sm:text-base">{datePE(item.fechaMovimiento)} - {item.concepto}</span><b className={`shrink-0 whitespace-nowrap ${item.tipo==='ingreso'?'text-income':'text-expense'}`}>{item.tipo==='ingreso'?'+':'-'} {money(item.monto)}</b></div>)}</div>}
 </Modal>
}

function Info({icon:Icon,label,value}){return <div className="flex min-w-0 gap-3">{Icon&&<Icon size={19} className="shrink-0 text-brand-600"/>}<div className="min-w-0"><p className="text-xs text-stone-500">{label}</p><p className="break-words font-semibold">{value||'--'}</p></div></div>}
function initials(name=''){return String(name).trim().slice(0,2).toUpperCase()||'IN'}
