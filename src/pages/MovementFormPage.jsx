import {useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {useNavigate,useSearchParams} from 'react-router-dom'
import {ArrowLeft,Save} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {Field,PageHeader} from '../components/ui'
import {expenseCategories,paymentMethods} from '../constants/options'

export default function MovementFormPage(){
 const {addMovement,tenants,properties,isAdmin}=useApp()
 const navigate=useNavigate()
 const [params]=useSearchParams()
 const {register,handleSubmit,watch,setValue,formState:{errors,isSubmitting}}=useForm({
  defaultValues:{
   tipo:params.get('tipo')||'ingreso',
   fechaMovimiento:new Date().toISOString().slice(0,10),
   metodoPago:'Efectivo',
   categoria:'Alquiler',
   tipoPago:'mensualidad'
  }
 })
 const tipo=watch('tipo')
 const tenantId=watch('inquilinoId')
 const availableTenants=tenants.filter(item=>item.estado!=='eliminado')
 const availableProperties=properties.filter(item=>item.estado!=='eliminado')

 useEffect(()=>{
  const tenant=tenants.find(item=>item.id===tenantId)
  if(tenant?.propiedadId)setValue('propiedadId',tenant.propiedadId)
 },[tenantId,setValue,tenants])

 if(!isAdmin)return <div className="card p-6 text-center sm:p-8">Su perfil es solo de lectura.</div>

 const submit=async data=>{
  await addMovement(data)
  navigate('/movimientos')
 }

 return <>
  <button onClick={()=>navigate(-1)} className="mb-4 flex min-h-11 items-center gap-2 text-sm font-semibold text-stone-600"><ArrowLeft size={18}/> Volver</button>
  <PageHeader title="Registrar movimiento" description="Elija ingreso o gasto y complete la informacion"/>
  <form onSubmit={handleSubmit(submit)} className="card p-4 min-[380px]:p-5 sm:p-7">
   <div className="mb-5 grid grid-cols-2 gap-2 min-[380px]:gap-3 sm:mb-6">
    {['ingreso','gasto'].map(item=><label key={item} className={`cursor-pointer rounded-xl border px-2 py-3.5 text-center font-bold capitalize sm:p-4 ${tipo===item?(item==='ingreso'?'border-emerald-500 bg-emerald-50 text-emerald-800':'border-red-400 bg-red-50 text-red-700'):'border-stone-200'}`}>
     <input type="radio" value={item} {...register('tipo')} className="sr-only"/>{item}
    </label>)}
   </div>

   <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
    <Field label={tipo==='ingreso'?'Fecha de recepcion':'Fecha del gasto'} error={errors.fechaMovimiento}><input type="date" className="field" {...register('fechaMovimiento',{required:'Indique la fecha'})}/></Field>
    <Field label="Monto (S/)" error={errors.monto}><input type="number" min="0.01" step="0.01" inputMode="decimal" className="field" placeholder="0.00" {...register('monto',{required:'Ingrese el monto',min:{value:.01,message:'El monto debe ser mayor a cero'}})}/></Field>

    {tipo==='ingreso'?<>
     <Field label="Inquilino o empresa"><select className="field" {...register('inquilinoId')}><option value="">Sin inquilino</option>{availableTenants.map(item=><option key={item.id} value={item.id}>{item.nombre}</option>)}</select></Field>
     <Field label="Tipo de pago"><select className="field" {...register('tipoPago')}>{['mensualidad','pago parcial','deuda atrasada','adelanto','garantia','servicio','otro'].map(item=><option key={item}>{item}</option>)}</select></Field>
     <Field label="Periodo(s) a los que corresponde"><input className="field" placeholder="Ej. enero y febrero 2026" {...register('periodosRelacionados')}/></Field>
    </>:<Field label="Categoria"><select className="field" {...register('categoria')}>{expenseCategories.map(item=><option key={item}>{item}</option>)}</select></Field>}

    <Field label="Espacio relacionado"><select className="field" {...register('propiedadId')}><option value="">Ninguno</option>{availableProperties.map(item=><option key={item.id} value={item.id}>{item.codigo} · {item.nombre}</option>)}</select></Field>
    <Field label="Metodo de pago"><select className="field" {...register('metodoPago')}>{paymentMethods.map(item=><option key={item}>{item}</option>)}</select></Field>
    <Field label="Concepto" error={errors.concepto}><input className="field" placeholder="Descripcion breve" {...register('concepto',{required:'Escriba el concepto'})}/></Field>
    <Field label={tipo==='ingreso'?'Pagado por':'Pagado a'}><input className="field" {...register('persona')}/></Field>
    <div className="sm:col-span-2"><Field label="Observaciones"><textarea rows="3" className="field resize-none" {...register('observaciones')}/></Field></div>
   </div>

   <div className="mt-6 flex flex-col-reverse gap-3 sm:mt-7 sm:flex-row sm:justify-end">
    <button type="button" onClick={()=>navigate(-1)} className="btn-secondary w-full sm:w-auto">Cancelar</button>
    <button disabled={isSubmitting} className="btn-primary w-full sm:w-auto"><Save size={18}/> {isSubmitting?'Guardando...':'Guardar movimiento'}</button>
   </div>
  </form>
 </>
}
