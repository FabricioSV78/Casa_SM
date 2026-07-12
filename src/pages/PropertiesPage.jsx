import {useState} from 'react'
import {MapPin,Plus,Trash2} from 'lucide-react'
import {useForm} from 'react-hook-form'
import {useApp} from '../context/AppContext'
import {Badge,Empty,Field,Modal,PageHeader} from '../components/ui'
import {money} from '../utils/format'

export default function PropertiesPage(){
 const {properties,tenants,addProperty,removeProperty,isAdmin}=useApp()
 const [open,setOpen]=useState(false)
 const {register,handleSubmit,reset,formState:{errors,isSubmitting}}=useForm({defaultValues:{tipo:'habitacion',estado:'disponible'}})
 const visibleProperties=properties.filter(item=>item.estado!=='eliminado')

 const save=async data=>{
  await addProperty(data)
  reset({tipo:'habitacion',estado:'disponible'})
  setOpen(false)
 }

 const handleDelete=async property=>{
  if(!confirm(`¿Eliminar ${property.codigo}? Si tiene inquilino asignado, el espacio se liberará.`))return
  await removeProperty(property)
 }

 return <>
  <PageHeader
   title="Habitaciones y oficinas"
   description="Ocupacion y situacion de cada espacio"
   action={isAdmin&&<button className="btn-primary" onClick={()=>setOpen(true)}><Plus size={18}/> Agregar espacio</button>}
  />

  {!visibleProperties.length?<Empty title="No hay espacios" text="Agrega la primera habitacion u oficina para verla aqui."/>:<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
   {visibleProperties.map(property=>{
    const tenant=tenants.find(item=>item.id===property.inquilinoActualId&&item.estado!=='eliminado')
    return <article className="card min-w-0 p-4 sm:p-5" key={property.id}>
     <div className="flex min-w-0 items-start justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
       <span className="rounded-lg bg-stone-100 px-3 py-1 text-sm font-bold">{property.codigo}</span>
       <Badge status={property.estado}/>
      </div>
      {isAdmin&&<button type="button" onClick={()=>handleDelete(property)} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${property.codigo}`}><Trash2 size={18}/></button>}
     </div>
     <h2 className="mt-4 break-words text-xl font-bold">{property.nombre||property.codigo}</h2>
     <p className="mt-1 flex min-w-0 items-start gap-1 text-sm text-stone-500"><MapPin size={15} className="mt-0.5 shrink-0"/><span className="break-words">{property.ubicacion||'Sin ubicacion'}</span></p>
     <div className="mt-5 rounded-xl bg-stone-50 p-3">
      <p className="text-xs text-stone-500">Inquilino actual</p>
      <p className="font-semibold">{tenant?.nombre||'Sin inquilino'}</p>
     </div>
     <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><span className="text-sm text-stone-500 sm:text-base">Precio mensual</span><b className="break-words">{money(property.precioReferencial)}</b></div>
    </article>
   })}
  </div>}

  {open&&<Modal title="Nuevo espacio" onClose={()=>setOpen(false)}>
   <form onSubmit={handleSubmit(save)} className="grid gap-4 sm:grid-cols-2">
    <Field label="Codigo" error={errors.codigo}><input className="field" {...register('codigo',{required:'Ingrese el codigo'})}/></Field>
    <Field label="Nombre"><input className="field" {...register('nombre')}/></Field>
    <Field label="Tipo"><select className="field" {...register('tipo')}><option value="habitacion">Habitacion</option><option value="oficina">Oficina</option></select></Field>
    <Field label="Ubicacion o piso"><input className="field" {...register('ubicacion')}/></Field>
    <Field label="Precio referencial"><input type="number" className="field" {...register('precioReferencial',{valueAsNumber:true})}/></Field>
    <Field label="Estado"><select className="field" {...register('estado')}><option value="disponible">Disponible</option><option value="ocupada">Ocupada</option><option value="mantenimiento">Mantenimiento</option><option value="inactiva">Inactiva</option></select></Field>
    <button disabled={isSubmitting} className="btn-primary mt-1 w-full sm:col-span-2">{isSubmitting?'Guardando...':'Guardar espacio'}</button>
   </form>
  </Modal>}
 </>
}
