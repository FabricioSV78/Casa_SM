import {useState} from 'react'
import {Building2,CalendarDays,Phone,Plus,Receipt,Trash2} from 'lucide-react'
import {useForm} from 'react-hook-form'
import {useApp} from '../context/AppContext'
import {Badge,Empty,Field,Modal,PageHeader} from '../components/ui'
import {datePE,money} from '../utils/format'

export default function TenantsPage(){
 const {tenants,properties,movements,addTenant,removeTenant,isAdmin}=useApp()
 const [selected,setSelected]=useState(null)
 const [adding,setAdding]=useState(false)
 const {register,handleSubmit,reset,formState:{errors,isSubmitting}}=useForm({defaultValues:{tipo:'persona'}})
 const activeTenants=tenants.filter(x=>x.estado==='activo').length
 const visibleTenants=tenants.filter(x=>x.estado!=='eliminado')
 const availableProperties=properties.filter(x=>x.estado!=='eliminado')

 const save=async data=>{
  await addTenant(data)
  reset({tipo:'persona'})
  setAdding(false)
 }

 return <>
  <PageHeader
   title="Inquilinos y empresas"
   description={`${activeTenants} contratos activos`}
   action={isAdmin&&<button className="btn-primary" onClick={()=>setAdding(true)}><Plus size={18}/> Agregar</button>}
  />

  <TenantDirectory tenants={visibleTenants} properties={properties} onSelect={setSelected}/>

  {selected&&<TenantDetail
   tenant={selected}
   property={properties.find(x=>x.id===selected.propiedadId)}
   movements={movements.filter(x=>x.inquilinoId===selected.id&&x.estado!=='eliminado')}
   isAdmin={isAdmin}
   onDelete={async()=>{
    if(!confirm(`¿Eliminar a ${selected.nombre}? El espacio asignado quedará disponible.`))return
    await removeTenant(selected)
    setSelected(null)
   }}
   onClose={()=>setSelected(null)}
  />}

  {adding&&<Modal title="Nuevo inquilino" onClose={()=>setAdding(false)}>
   <form onSubmit={handleSubmit(save)} className="grid gap-4 sm:grid-cols-2">
    <Field label="Nombre o razon social" error={errors.nombre}><input className="field" {...register('nombre',{required:'Ingrese el nombre'})}/></Field>
    <Field label="Tipo"><select className="field" {...register('tipo')}><option value="persona">Persona</option><option value="empresa">Empresa</option></select></Field>
    <Field label="DNI o RUC"><input className="field" {...register('documento')}/></Field>
    <Field label="Celular"><input className="field" {...register('celular')}/></Field>
    <Field label="Correo"><input type="email" className="field" {...register('correo')}/></Field>
    <Field label="Espacio asignado"><select className="field" {...register('propiedadId')}><option value="">Sin asignar</option>{availableProperties.map(x=><option key={x.id} value={x.id}>{x.codigo} - {x.nombre}</option>)}</select></Field>
    <Field label="Inicio"><input type="date" className="field" {...register('fechaInicio')}/></Field>
    <Field label="Precio mensual" error={errors.precioMensual}><input type="number" className="field" {...register('precioMensual',{required:'Ingrese el precio',valueAsNumber:true})}/></Field>
    <Field label="Dia de pago"><input type="number" min="1" max="31" className="field" {...register('diaPago',{valueAsNumber:true})}/></Field>
    <Field label="Garantia"><input type="number" className="field" {...register('garantia',{valueAsNumber:true})}/></Field>
    <button disabled={isSubmitting} className="btn-primary sm:col-span-2">{isSubmitting?'Guardando...':'Guardar inquilino'}</button>
   </form>
  </Modal>}
 </>
}

function TenantDirectory({tenants,properties,onSelect}){
 if(!tenants.length)return <Empty title="No hay inquilinos" text="Agregue el primer contrato para verlo aqui."/>

 return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
  {tenants.map(tenant=>{
   const property=properties.find(x=>x.id===tenant.propiedadId)

   return <button key={tenant.id} onClick={()=>onSelect(tenant)} className="card p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-300">
    <div className="flex items-start justify-between gap-3">
     <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 font-bold text-brand-700">{initials(tenant.nombre)}</div>
     <Badge status={tenant.estado||'activo'}/>
    </div>
    <h2 className="mt-4 text-lg font-bold">{tenant.nombre}</h2>
    <p className="text-sm capitalize text-stone-500">{tenant.tipo||'persona'} - {property?.codigo||'Sin espacio'}</p>
    <div className="mt-4 grid gap-3 border-t pt-4">
     <div className="flex items-center justify-between"><span className="text-sm text-stone-500">Mensualidad</span><b>{money(tenant.precioMensual)}</b></div>
     <div className="flex items-center justify-between"><span className="text-sm text-stone-500">Dia de pago</span><b>{tenant.diaPago||'--'}</b></div>
    </div>
   </button>
  })}
 </div>
}

function TenantDetail({tenant,property,movements,isAdmin,onDelete,onClose}){
 return <Modal title="Detalle del inquilino" onClose={onClose}>
  <div className="rounded-2xl bg-white p-5">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div><h3 className="text-xl font-bold">{tenant.nombre}</h3><p className="text-stone-500">{tenant.documento||'Sin documento'}</p></div>
     <Badge status={tenant.estado||'activo'}/>
   </div>
   <div className="mt-5 grid gap-4 sm:grid-cols-2">
    <Info icon={Phone} label="Celular" value={tenant.celular}/>
    <Info icon={Building2} label="Espacio" value={property?.nombre||property?.codigo}/>
    <Info label="Precio mensual" value={money(tenant.precioMensual)}/>
    <Info icon={CalendarDays} label="Dia de pago" value={tenant.diaPago?`Dia ${tenant.diaPago}`:'Sin definir'}/>
    <Info label="Inicio del alquiler" value={tenant.fechaInicio?datePE(tenant.fechaInicio):'Sin fecha'}/>
    <Info label="Garantia" value={money(tenant.garantia)}/>
   </div>
  </div>

  {isAdmin&&<div className="mt-4 flex justify-end">
   <button type="button" onClick={onDelete} className="btn-secondary text-red-700 hover:bg-red-50 hover:text-red-800"><Trash2 size={18}/> Eliminar inquilino</button>
  </div>}

  <h3 className="mb-3 mt-6 flex items-center gap-2 font-bold"><Receipt size={18}/> Movimientos asociados</h3>
  {!movements.length?<Empty title="Sin movimientos registrados" text="Los movimientos asociados a este inquilino apareceran aqui."/>:<div className="space-y-2">{movements.map(x=><div key={x.id} className="flex justify-between gap-3 rounded-xl bg-white p-3"><span>{datePE(x.fechaMovimiento)} - {x.concepto}</span><b className={x.tipo==='ingreso'?'text-income':'text-expense'}>{x.tipo==='ingreso'?'+':'-'} {money(x.monto)}</b></div>)}</div>}
 </Modal>
}

function Info({icon:Icon,label,value}){return <div className="flex gap-3">{Icon&&<Icon size={19} className="text-brand-600"/>}<div><p className="text-xs text-stone-500">{label}</p><p className="font-semibold">{value||'--'}</p></div></div>}
function initials(name=''){return String(name).trim().slice(0,2).toUpperCase()||'IN'}
