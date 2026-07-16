import {useMemo,useState} from 'react'
import {Filter,MapPin,Plus,SquarePen,Trash2} from 'lucide-react'
import {useForm} from 'react-hook-form'
import {useApp} from '../context/AppContext'
import {Badge,Empty,Field,Modal,PageHeader} from '../components/ui'
import {money} from '../utils/format'

const propertyIdsOf=tenant=>[...new Set([...(tenant?.propiedadIds||[]),tenant?.propiedadId].filter(Boolean))]
const floorOf=property=>String(property.ubicacion||'Sin piso').trim()||'Sin piso'

export default function PropertiesPage(){
 const {properties,tenants,addProperty,editProperty,removeProperty,isAdmin}=useApp()
 const [formProperty,setFormProperty]=useState(undefined)
 const [floor,setFloor]=useState('todos')
 const visibleProperties=properties.filter(item=>item.estado!=='eliminado')
 const floors=useMemo(()=>[...new Set(visibleProperties.map(floorOf))].sort((a,b)=>a.localeCompare(b,'es')),[visibleProperties])
 const filteredProperties=visibleProperties.filter(property=>floor==='todos'||floorOf(property)===floor)

 const save=async data=>{
  if(data.id)await editProperty(data)
  else await addProperty(data)
  setFormProperty(undefined)
 }

 const handleDelete=async property=>{
  if(!confirm(`Eliminar ${property.codigo}? Si tiene inquilino asignado, se quitara de su contrato.`))return
  await removeProperty(property)
 }

 return <>
  <PageHeader
   title="Habitaciones y oficinas"
   description="Ocupacion y situacion de cada espacio"
   action={isAdmin&&<button className="btn-primary" onClick={()=>setFormProperty(null)}><Plus size={18}/> Agregar espacio</button>}
  />

  {!!visibleProperties.length&&<div className="mb-5 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
   <p className="text-sm text-stone-500">{filteredProperties.length} de {visibleProperties.length} espacios</p>
   <label className="relative w-full sm:w-64">
    <Filter size={17} className="pointer-events-none absolute left-3 top-3.5 text-stone-400"/>
    <select aria-label="Filtrar espacios por piso" className="field !pl-10" value={floor} onChange={event=>setFloor(event.target.value)}>
     <option value="todos">Todos los pisos</option>
     {floors.map(item=><option key={item} value={item}>{item}</option>)}
    </select>
   </label>
  </div>}

  {!filteredProperties.length?<Empty title={visibleProperties.length?'No hay espacios en este piso':'No hay espacios'} text={visibleProperties.length?'Seleccione otro piso para ver sus espacios.':'Agrega la primera habitacion u oficina para verla aqui.'}/>:<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
   {filteredProperties.map(property=>{
    const tenant=tenants.find(item=>item.estado!=='eliminado'&&(item.id===property.inquilinoActualId||propertyIdsOf(item).includes(property.id)))
    const effectiveStatus=tenant?'ocupada':property.estado
    return <article className="card min-w-0 p-4 sm:p-5" key={property.id}>
     <div className="flex min-w-0 items-start justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
       <span className="rounded-lg bg-stone-100 px-3 py-1 text-sm font-bold">{property.codigo}</span>
       <Badge status={effectiveStatus}/>
      </div>
      {isAdmin&&<div className="flex shrink-0 gap-1">
       <button type="button" onClick={()=>setFormProperty({...property,estado:effectiveStatus})} className="grid h-10 w-10 place-items-center rounded-lg text-stone-500 hover:bg-brand-50 hover:text-brand-700" aria-label={`Editar ${property.codigo}`}><SquarePen size={18}/></button>
       <button type="button" onClick={()=>handleDelete(property)} className="grid h-10 w-10 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${property.codigo}`}><Trash2 size={18}/></button>
      </div>}
     </div>
     <h2 className="mt-4 break-words text-xl font-bold">{property.nombre||property.codigo}</h2>
     <p className="mt-1 flex min-w-0 items-start gap-1 text-sm text-stone-500"><MapPin size={15} className="mt-0.5 shrink-0"/><span className="break-words">{floorOf(property)}</span></p>
     <div className="mt-5 rounded-lg bg-stone-50 p-3">
      <p className="text-xs text-stone-500">Inquilino actual</p>
      <p className="break-words font-semibold">{tenant?.nombre||'Sin inquilino'}</p>
     </div>
     <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><span className="text-sm text-stone-500 sm:text-base">Precio mensual</span><b className="break-words">{money(property.precioReferencial)}</b></div>
    </article>
   })}
  </div>}

  {formProperty!==undefined&&<PropertyFormModal property={formProperty} onSave={save} onClose={()=>setFormProperty(undefined)}/>}
 </>
}

function PropertyFormModal({property,onSave,onClose}){
 const occupied=Boolean(property?.inquilinoActualId)||property?.estado==='ocupada'
 const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm({
  defaultValues:{
   codigo:property?.codigo||'',
   nombre:property?.nombre||'',
   tipo:property?.tipo||'habitacion',
   ubicacion:property?.ubicacion||'',
   precioReferencial:property?.precioReferencial??'',
   estado:occupied?'ocupada':property?.estado||'disponible',
   observaciones:property?.observaciones||''
  }
 })

 return <Modal title={property?'Editar espacio':'Nuevo espacio'} onClose={onClose}>
  <form onSubmit={handleSubmit(data=>onSave({...data,id:property?.id,estado:occupied?'ocupada':data.estado}))} className="grid gap-4 sm:grid-cols-2">
   <Field label="Codigo" error={errors.codigo}><input className="field" {...register('codigo',{required:'Ingrese el codigo'})}/></Field>
   <Field label="Nombre"><input className="field" {...register('nombre')}/></Field>
   <Field label="Tipo"><select className="field" {...register('tipo')}><option value="habitacion">Habitacion</option><option value="oficina">Oficina</option><option value="local">Local</option><option value="deposito">Deposito</option></select></Field>
   <Field label="Piso o ubicacion" error={errors.ubicacion}><input className="field" placeholder="Ej. Primer piso" {...register('ubicacion',{required:'Indique el piso'})}/></Field>
   <Field label="Precio referencial"><input type="number" min="0" step="0.01" inputMode="decimal" className="field" {...register('precioReferencial',{valueAsNumber:true})}/></Field>
   <Field label="Estado"><select className="field disabled:cursor-not-allowed disabled:bg-stone-100" disabled={occupied} {...register('estado')}><option value="disponible">Disponible</option>{occupied&&<option value="ocupada">Ocupada</option>}<option value="mantenimiento">Mantenimiento</option><option value="inactiva">Inactiva</option></select></Field>
   {occupied&&<p className="-mt-2 text-xs text-stone-500 sm:col-span-2">El estado ocupado se administra desde la asignacion del inquilino.</p>}
   <div className="sm:col-span-2"><Field label="Observaciones"><textarea rows="3" className="field resize-none" {...register('observaciones')}/></Field></div>
   <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
    <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">Cancelar</button>
    <button disabled={isSubmitting} className="btn-primary w-full sm:w-auto">{isSubmitting?'Guardando...':property?'Guardar cambios':'Guardar espacio'}</button>
   </div>
  </form>
 </Modal>
}
