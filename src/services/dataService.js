import {hasSupabaseConfig,requireSupabase,usingMocks} from './supabaseClient'

const ACCESS_KEY=(import.meta.env.VITE_APP_ACCESS_KEY||'111943').trim()
const SESSION_HOURS=12

let currentSession=null

const tables={
 users:'usuarios',
 tenants:'inquilinos',
 properties:'propiedades',
 movements:'movimientos',
 obligations:'obligaciones_mensuales',
 paymentApplications:'aplicaciones_pago',
 audit:'auditoria'
}

const fields={
 usuarios:{creadoEn:'creado_en'},
 inquilinos:{propiedadId:'propiedad_id',fechaInicio:'fecha_inicio',precioMensual:'precio_mensual',diaPago:'dia_pago',creadoEn:'creado_en',actualizadoEn:'actualizado_en'},
 propiedades:{precioReferencial:'precio_referencial',inquilinoActualId:'inquilino_actual_id',creadoEn:'creado_en',actualizadoEn:'actualizado_en'},
 movimientos:{fechaMovimiento:'fecha_movimiento',inquilinoId:'inquilino_id',propiedadId:'propiedad_id',metodoPago:'metodo_pago',tipoPago:'tipo_pago',periodosRelacionados:'periodos_relacionados',usuarioId:'usuario_id',creadoEn:'creado_en',actualizadoEn:'actualizado_en'},
 obligaciones_mensuales:{inquilinoId:'inquilino_id',propiedadId:'propiedad_id',montoEsperado:'monto_esperado',montoPagado:'monto_pagado',saldoPendiente:'saldo_pendiente',fechaVencimiento:'fecha_vencimiento',creadoEn:'creado_en',actualizadoEn:'actualizado_en'},
 aplicaciones_pago:{movimientoId:'movimiento_id',obligacionId:'obligacion_id',montoAplicado:'monto_aplicado',creadoEn:'creado_en'},
 auditoria:{entidadId:'entidad_id',datosAnteriores:'datos_anteriores',datosNuevos:'datos_nuevos',usuarioId:'usuario_id'}
}

const dbColumns={
 usuarios:['id','nombre','usuario','rol','estado','creado_en'],
 inquilinos:['id','nombre','documento','celular','correo','tipo','propiedad_id','fecha_inicio','precio_mensual','dia_pago','garantia','estado','observaciones','creado_en','actualizado_en'],
 propiedades:['id','codigo','nombre','tipo','ubicacion','precio_referencial','estado','inquilino_actual_id','observaciones','creado_en','actualizado_en'],
 movimientos:['id','tipo','fecha_movimiento','monto','categoria','concepto','inquilino_id','propiedad_id','metodo_pago','tipo_pago','periodos_relacionados','observaciones','usuario_id','creado_en','actualizado_en','estado'],
 obligaciones_mensuales:['id','inquilino_id','propiedad_id','periodo','monto_esperado','monto_pagado','saldo_pendiente','estado','fecha_vencimiento','creado_en','actualizado_en'],
 aplicaciones_pago:['id','movimiento_id','obligacion_id','monto_aplicado','creado_en'],
 auditoria:['id','entidad','entidad_id','accion','datos_anteriores','datos_nuevos','usuario_id','fecha']
}

function clean(value){
 if(typeof value==='string')return value.replace(/[<>]/g,'').trim().slice(0,2000)
 return value
}

function sanitize(input){
 const out={}
 Object.entries(input||{}).forEach(([key,value])=>{
  if(key==='authToken'||key==='_session')return
  out[key]=Array.isArray(value)?value.map(clean):clean(value)
 })
 return out
}

function toDb(table,row){
 const map=fields[table]||{}
 const allowed=new Set(dbColumns[table]||[])
 return Object.fromEntries(Object.entries(row||{}).flatMap(([key,value])=>{
  if(key==='_row')return []
  const dbKey=map[key]||key
  if(allowed.size&&!allowed.has(dbKey))return []
  return [[dbKey,value??null]]
 }))
}

function fromDb(table,row){
 if(!row)return row
 const map=fields[table]||{}
 const reverse=Object.fromEntries(Object.entries(map).map(([app,db])=>[db,app]))
 return Object.fromEntries(Object.entries(row).map(([key,value])=>[reverse[key]||key,value]))
}

function makeToken(user){
 const exp=Date.now()+SESSION_HOURS*60*60*1000
 const token=btoa(JSON.stringify({id:user.id,nombre:user.nombre,usuario:user.usuario,rol:user.rol,exp}))
 return {token,expiresAt:new Date(exp).toISOString()}
}

function parseToken(token){
 if(!token)return null
 try{return JSON.parse(atob(token))}catch{return null}
}

export function setDataAuthToken(token){
 const session=parseToken(token)
 currentSession=session&&Date.now()<Number(session.exp)?session:null
}

function requireSession(){
 if(!currentSession)throw new Error('Sesion requerida')
 if(Date.now()>Number(currentSession.exp)){
  currentSession=null
  throw new Error('Sesion vencida')
 }
 return currentSession
}

function requireAdmin(){
 const session=requireSession()
 if(session.rol!=='administradora')throw new Error('Permiso insuficiente')
 return session
}

function validate(table,data){
 if(!data||typeof data!=='object')throw new Error('Datos invalidos')
 if(table===tables.movements){
  if(!['ingreso','gasto'].includes(data.tipo))throw new Error('Tipo de movimiento invalido')
  if(!data.fechaMovimiento)throw new Error('La fecha es obligatoria')
  if(!(Number(data.monto)>0))throw new Error('El monto debe ser mayor a cero')
  if(!data.concepto)throw new Error('El concepto es obligatorio')
 }
 if(table===tables.tenants&&!data.nombre)throw new Error('El nombre es obligatorio')
 if(table===tables.properties&&!data.codigo)throw new Error('El codigo es obligatorio')
}

async function audit(entity,id,action,before,after,userId){
 const db=requireSupabase()
 await db.from(tables.audit).insert(toDb(tables.audit,{
  id:crypto.randomUUID(),
  entidad:entity,
  entidadId:id,
  accion:action,
  datosAnteriores:before||{},
  datosNuevos:after||{},
  usuarioId:userId||'',
  fecha:new Date().toISOString()
 }))
}

async function list(table,filters={}){
 requireSession()
 const db=requireSupabase()
 let query=db.from(table).select('*')
 if(filters.id)query=query.eq('id',filters.id)
 if(table!==tables.paymentApplications)query=query.neq('estado','eliminado')
 if(table===tables.movements)query=query.order('fecha_movimiento',{ascending:false})
 if(table===tables.tenants)query=query.order('nombre',{ascending:true})
 if(table===tables.properties)query=query.order('codigo',{ascending:true})
 if(table===tables.obligations)query=query.order('periodo',{ascending:false})
 const {data,error}=await query
 if(error)throw error
 return (data||[]).map(row=>fromDb(table,row))
}

async function create(table,input){
 const session=requireAdmin()
 const db=requireSupabase()
 const data=sanitize(input)
 validate(table,data)
 const now=new Date().toISOString()
 data.id=data.id||crypto.randomUUID()
 data.creadoEn=data.creadoEn||now
 data.actualizadoEn=now
 data.estado=data.estado||'activo'
 data.usuarioId=data.usuarioId||session.id
 const {data:created,error}=await db.from(table).insert(toDb(table,data)).select('*').single()
 if(error)throw error
 const saved=fromDb(table,created)
 await audit(table,saved.id,'crear',null,saved,data.usuarioId)
 return saved
}

async function update(table,input){
 const session=requireAdmin()
 const db=requireSupabase()
 const data=sanitize(input)
 if(!data.id)throw new Error('Falta id')
 const old=(await list(table,{id:data.id}))[0]
 if(!old)throw new Error('Registro no encontrado')
 const merged={...old,...data,actualizadoEn:new Date().toISOString(),usuarioId:data.usuarioId||session.id}
 validate(table,merged)
 const {data:updated,error}=await db.from(table).update(toDb(table,merged)).eq('id',data.id).select('*').single()
 if(error)throw error
 const saved=fromDb(table,updated)
 await audit(table,saved.id,'editar',old,saved,merged.usuarioId)
 return saved
}

async function logicalDelete(table,input){
 if(!input.id)throw new Error('Falta id')
 return update(table,{id:input.id,estado:'eliminado',usuarioId:input.usuarioId})
}

async function releasePropertyAssignment(propertyId,usuarioId){
 if(!propertyId)return null
 const property=(await list(tables.properties,{id:propertyId}))[0]
 if(!property)return null
 return update(tables.properties,{
  id:property.id,
  estado:'disponible',
  inquilinoActualId:null,
  usuarioId
 })
}

function normalizeDay(day){
 const value=Math.floor(Number(day||1))
 return Math.min(31,Math.max(1,value||1))
}

async function login(rol,clave){
 if(!hasSupabaseConfig)throw new Error('Supabase no configurado')
 if(String(clave)!==ACCESS_KEY)throw new Error('Clave incorrecta')
 const db=requireSupabase()
 const {data,error}=await db.from(tables.users).select('*').eq('rol',rol).eq('estado','activo').maybeSingle()
 if(error)throw error
 if(!data)throw new Error('Usuario no encontrado')
 const user=fromDb(tables.users,data)
 const session=makeToken(user)
 setDataAuthToken(session.token)
 return {user:{id:user.id,nombre:user.nombre,usuario:user.usuario,rol:user.rol,estado:user.estado},...session}
}

async function createTenant(input){
 return create(tables.tenants,input)
}

async function deleteTenant(id,usuarioId){
 const tenant=(await list(tables.tenants,{id}))[0]
 if(!tenant)throw new Error('Inquilino no encontrado')
 const deleted=await logicalDelete(tables.tenants,{id,usuarioId})
 const property=await releasePropertyAssignment(tenant.propiedadId,usuarioId)
 return {tenant:deleted,property}
}

async function deleteProperty(id,usuarioId){
 const property=(await list(tables.properties,{id}))[0]
 if(!property)throw new Error('Espacio no encontrado')
 const relatedTenants=(await list(tables.tenants,{})).filter(item=>item.propiedadId===id)
 const updatedTenants=[]
 for(const tenant of relatedTenants){
  updatedTenants.push(await update(tables.tenants,{id:tenant.id,propiedadId:null,usuarioId}))
 }
 const deleted=await logicalDelete(tables.properties,{id,usuarioId})
 return {property:deleted,tenants:updatedTenants}
}

async function createMonthlyObligations({period,usuarioId}){
 requireAdmin()
 if(!/^\d{4}-\d{2}$/.test(period||''))throw new Error('Periodo invalido')
 const [existing,tenants]=await Promise.all([list(tables.obligations,{}),list(tables.tenants,{})])
 const created=[]
 for(const tenant of tenants.filter(item=>item.estado==='activo')){
  if(existing.some(item=>item.inquilinoId===tenant.id&&item.periodo===period))continue
  created.push(await create(tables.obligations,{
   inquilinoId:tenant.id,
   propiedadId:tenant.propiedadId||'',
   periodo,
   montoEsperado:Number(tenant.precioMensual||0),
   montoPagado:0,
   saldoPendiente:Number(tenant.precioMensual||0),
   estado:'pendiente',
   fechaVencimiento:`${period}-${String(normalizeDay(tenant.diaPago)).padStart(2,'0')}`,
   usuarioId
  }))
 }
 return created
}

async function applyPayment(input){
 const session=requireAdmin()
 const db=requireSupabase()
 const amount=Number(input.montoAplicado)
 if(!(amount>0))throw new Error('Monto invalido')
 const [movement,obligation]=await Promise.all([
  list(tables.movements,{id:input.movimientoId}).then(items=>items[0]),
  list(tables.obligations,{id:input.obligacionId}).then(items=>items[0])
 ])
 if(!movement||movement.tipo!=='ingreso')throw new Error('Ingreso no encontrado')
 if(!obligation)throw new Error('Obligacion no encontrada')
 const {data:applications,error:applicationsError}=await db.from(tables.paymentApplications).select('*').eq('movimiento_id',input.movimientoId)
 if(applicationsError)throw applicationsError
 const already=(applications||[]).reduce((sum,row)=>sum+Number(row.monto_aplicado||0),0)
 if(already+amount>Number(movement.monto))throw new Error('El monto aplicado supera el ingreso')
 const now=new Date().toISOString()
 const app={id:crypto.randomUUID(),movimientoId:input.movimientoId,obligacionId:input.obligacionId,montoAplicado:amount,creadoEn:now}
 const {data:created,error:createError}=await db.from(tables.paymentApplications).insert(toDb(tables.paymentApplications,app)).select('*').single()
 if(createError)throw createError
 const paid=Number(obligation.montoPagado||0)+amount
 const balance=Math.max(0,Number(obligation.montoEsperado||0)-paid)
 const updated={...obligation,montoPagado:paid,saldoPendiente:balance,estado:balance===0?'pagado':'parcial',actualizadoEn:now,usuarioId:input.usuarioId||session.id}
 const {data:updatedRow,error:updateError}=await db.from(tables.obligations).update(toDb(tables.obligations,updated)).eq('id',obligation.id).select('*').single()
 if(updateError)throw updateError
 await audit(tables.obligations,obligation.id,'aplicar_pago',obligation,fromDb(tables.obligations,updatedRow),input.usuarioId||session.id)
 return fromDb(tables.paymentApplications,created)
}

async function dashboard(month,year){
 const [movements,obligations]=await Promise.all([list(tables.movements,{}),list(tables.obligations,{})])
 const items=movements.filter(item=>{
  const date=new Date(`${item.fechaMovimiento}T12:00:00`)
  return date.getMonth()+1===Number(month)&&date.getFullYear()===Number(year)
 })
 const income=items.filter(item=>item.tipo==='ingreso').reduce((sum,item)=>sum+Number(item.monto||0),0)
 const expense=items.filter(item=>item.tipo==='gasto').reduce((sum,item)=>sum+Number(item.monto||0),0)
 const available=movements.reduce((sum,item)=>sum+(item.tipo==='ingreso'?Number(item.monto||0):-Number(item.monto||0)),0)
 const pending=obligations.reduce((sum,item)=>sum+Number(item.saldoPendiente||0),0)
 const debtors=new Set(obligations.filter(item=>Number(item.saldoPendiente||0)>0).map(item=>item.inquilinoId)).size
 return {income,expense,balance:income-expense,available,count:items.length,pending,debtors,movements:items}
}

async function statement(inquilinoId){
 const [tenants,obligations,movements]=await Promise.all([list(tables.tenants,{id:inquilinoId}),list(tables.obligations,{}),list(tables.movements,{})])
 const tenant=tenants[0]
 if(!tenant)throw new Error('Inquilino no encontrado')
 return {
  tenant,
  obligations:obligations.filter(item=>item.inquilinoId===inquilinoId),
  payments:movements.filter(item=>item.inquilinoId===inquilinoId&&item.tipo==='ingreso')
 }
}

export const dataService={
 usingMocks,
 setToken:setDataAuthToken,
 login,
 dashboard,
 movements:filters=>list(tables.movements,filters),
 createMovement:data=>create(tables.movements,data),
 updateMovement:data=>update(tables.movements,data),
 deleteMovement:(id,usuarioId)=>logicalDelete(tables.movements,{id,usuarioId}),
 tenants:()=>list(tables.tenants,{}),
 createTenant,
 deleteTenant,
 updateTenant:data=>update(tables.tenants,data),
 properties:()=>list(tables.properties,{}),
 createProperty:data=>create(tables.properties,data),
 deleteProperty,
 updateProperty:data=>update(tables.properties,data),
 obligations:()=>list(tables.obligations,{}),
 statement,
 createObligations:(period,usuarioId)=>createMonthlyObligations({period,usuarioId}),
 applyPayment,
 reports:filters=>dashboard(Number(filters?.month)||new Date().getMonth()+1,Number(filters?.year)||new Date().getFullYear())
}
