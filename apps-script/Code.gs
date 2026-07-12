const SCHEMA = {
 Usuarios:['id','nombre','usuario','rol','estado','creadoEn'],
 Inquilinos:['id','nombre','documento','celular','correo','tipo','propiedadId','fechaInicio','precioMensual','diaPago','garantia','estado','observaciones','creadoEn','actualizadoEn'],
 Propiedades:['id','codigo','nombre','tipo','ubicacion','precioReferencial','estado','inquilinoActualId','observaciones','creadoEn','actualizadoEn'],
 Movimientos:['id','tipo','fechaMovimiento','monto','categoria','concepto','inquilinoId','propiedadId','metodoPago','tipoPago','periodosRelacionados','observaciones','usuarioId','creadoEn','actualizadoEn','estado'],
 ObligacionesMensuales:['id','inquilinoId','propiedadId','periodo','montoEsperado','montoPagado','saldoPendiente','estado','fechaVencimiento','creadoEn','actualizadoEn'],
 AplicacionesPago:['id','movimientoId','obligacionId','montoAplicado','creadoEn'],
 Categorias:['id','tipo','nombre','estado'],
 Auditoria:['id','entidad','entidadId','accion','datosAnteriores','datosNuevos','usuarioId','fecha']
};

const DEFAULT_ACCESS_KEY = '111943';
const SESSION_HOURS = 12;
const ADMIN_ACTIONS = {
 setupSheets:true, createMovement:true, updateMovement:true, deleteMovement:true,
 createTenant:true, updateTenant:true, createProperty:true, updateProperty:true,
 createMonthlyObligations:true, applyPayment:true
};

function doGet(e){ return handle_((e&&e.parameter&&e.parameter.action)||'health',e&&e.parameter||{}); }
function doPost(e){
 try { const body=JSON.parse((e&&e.postData&&e.postData.contents)||'{}'); return handle_(body.action,body.payload||{}); }
 catch(err){ return json_({ok:false,error:{code:'BAD_REQUEST',message:err.message}}); }
}

function handle_(action,payload){
 try {
  const routes={
   health:()=>({status:'ok'}), login:()=>login_(payload), setupSheets:setupSheets_,
   getDashboard:getDashboard_, listMovements:()=>list_('Movimientos',payload),
   createMovement:()=>create_('Movimientos',withUser_(payload)), updateMovement:()=>update_('Movimientos',withUser_(payload)),
   deleteMovement:()=>logicalDelete_('Movimientos',withUser_(payload)), listTenants:()=>list_('Inquilinos',payload),
   createTenant:()=>createTenant_(withUser_(payload)), updateTenant:()=>update_('Inquilinos',withUser_(payload)),
   listProperties:()=>list_('Propiedades',payload), createProperty:()=>create_('Propiedades',withUser_(payload)),
   updateProperty:()=>update_('Propiedades',withUser_(payload)), listObligations:()=>list_('ObligacionesMensuales',payload),
   getTenantStatement:getTenantStatement_, createMonthlyObligations:()=>createMonthlyObligations_(withUser_(payload)),
   applyPayment:()=>applyPayment_(withUser_(payload)), getReports:getReports_
  };
  if(!routes[action]) throw new Error('Acción no reconocida: '+action);
  if(action!=='health'&&action!=='login') requireSession_(payload&&payload.authToken,ADMIN_ACTIONS[action]);
  return json_({ok:true,data:routes[action]()});
 } catch(err){ return json_({ok:false,error:{code:'SERVER_ERROR',message:err.message}}); }
}

function db_(){ const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'); if(!id) throw new Error('Falta SPREADSHEET_ID en PropertiesService'); return SpreadsheetApp.openById(id); }
function setupSheets(){ return setupSheets_(); }
function setupSheets_(){ const ss=db_(); Object.keys(SCHEMA).forEach(name=>{let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0){sh.getRange(1,1,1,SCHEMA[name].length).setValues([SCHEMA[name]]);sh.setFrozenRows(1);sh.getRange(1,1,1,SCHEMA[name].length).setFontWeight('bold').setBackground('#f5d7ad');sh.autoResizeColumns(1,SCHEMA[name].length);}});ensureDefaultUsers_();ensureSessionSecret_();return {sheets:Object.keys(SCHEMA)}; }

function ensureDefaultUsers_(){
 const now=new Date().toISOString();
 upsertById_('Usuarios',{id:'u1',nombre:'Karla',usuario:'admin',rol:'administradora',estado:'activo',creadoEn:now});
 upsertById_('Usuarios',{id:'u2',nombre:'Ada',usuario:'propietaria',rol:'propietaria',estado:'activo',creadoEn:now});
}

function upsertById_(sheetName,data){
 const sh=db_().getSheetByName(sheetName),headers=SCHEMA[sheetName],old=rows_(sheetName).find(x=>x.id===data.id);
 const row=headers.map(h=>data[h]??'');
 if(old) sh.getRange(old._row,1,1,headers.length).setValues([row]);
 else sh.appendRow(row);
}

function rows_(sheetName){ const sh=db_().getSheetByName(sheetName);if(!sh)return[];const values=sh.getDataRange().getValues();if(values.length<2)return[];const headers=values[0];return values.slice(1).map((row,index)=>{const obj={_row:index+2};headers.forEach((h,i)=>obj[h]=row[i] instanceof Date?row[i].toISOString():row[i]);return obj;}); }
function list_(sheetName,filters){ filters=filters||{}; return rows_(sheetName).filter(x=>x.estado!=='eliminado').filter(x=>!filters.id||x.id===filters.id); }
function clean_(value){ if(typeof value==='string')return value.replace(/[<>]/g,'').trim().slice(0,2000);return value; }
function sanitize_(obj){const out={};Object.keys(obj||{}).forEach(k=>{if(k==='authToken'||k==='_session')return;out[k]=Array.isArray(obj[k])?obj[k].map(clean_):clean_(obj[k]);});return out;}

function login_(payload){
 const data=sanitize_(payload);
 if(data.clave!==getAccessKey_()) throw new Error('Clave incorrecta');
 const user=list_('Usuarios',{}).find(x=>x.rol===data.rol&&x.estado==='activo');
 if(!user) throw new Error('Usuario no encontrado');
 const session=createSession_(user);
 return {user:publicUser_(user),token:session.token,expiresAt:session.expiresAt};
}

function publicUser_(user){ return {id:user.id,nombre:user.nombre,usuario:user.usuario,rol:user.rol,estado:user.estado}; }
function getAccessKey_(){ return PropertiesService.getScriptProperties().getProperty('APP_ACCESS_KEY')||DEFAULT_ACCESS_KEY; }
function ensureSessionSecret_(){ const props=PropertiesService.getScriptProperties(); if(!props.getProperty('SESSION_SECRET')) props.setProperty('SESSION_SECRET',Utilities.getUuid()+Utilities.getUuid()); }
function getSessionSecret_(){ ensureSessionSecret_(); return PropertiesService.getScriptProperties().getProperty('SESSION_SECRET'); }
function createSession_(user){ const exp=Date.now()+SESSION_HOURS*60*60*1000,payload=Utilities.base64EncodeWebSafe(JSON.stringify({id:user.id,nombre:user.nombre,usuario:user.usuario,rol:user.rol,exp}));return {token:payload+'.'+sign_(payload),expiresAt:new Date(exp).toISOString()}; }
function sign_(value){ return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value,getSessionSecret_())); }
function requireSession_(token,adminOnly){
 if(!token) throw new Error('Sesión requerida');
 const parts=String(token).split('.');
 if(parts.length!==2||sign_(parts[0])!==parts[1]) throw new Error('Sesión inválida');
 const session=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
 if(Date.now()>Number(session.exp)) throw new Error('Sesión vencida');
 if(adminOnly&&session.rol!=='administradora') throw new Error('Permiso insuficiente');
 return session;
}
function withUser_(payload){ const session=requireSession_(payload&&payload.authToken,ADMIN_ACTIONS[payload&&payload.action]); return {...payload,usuarioId:session.id,_session:session}; }

function validate_(sheetName,data){if(!data||typeof data!=='object')throw new Error('Datos inválidos');if(sheetName==='Movimientos'){if(!['ingreso','gasto'].includes(data.tipo))throw new Error('Tipo de movimiento inválido');if(!data.fechaMovimiento)throw new Error('La fecha es obligatoria');if(!(Number(data.monto)>0))throw new Error('El monto debe ser mayor a cero');if(!data.concepto)throw new Error('El concepto es obligatorio');}if(sheetName==='Inquilinos'&&!data.nombre)throw new Error('El nombre es obligatorio');if(sheetName==='Propiedades'&&!data.codigo)throw new Error('El código es obligatorio');}
function create_(sheetName,input){const lock=LockService.getScriptLock();lock.waitLock(15000);try{const data=sanitize_(input);validate_(sheetName,data);const headers=SCHEMA[sheetName],now=new Date().toISOString();data.id=data.id||Utilities.getUuid();data.creadoEn=data.creadoEn||now;data.actualizadoEn=now;data.estado=data.estado||'activo';db_().getSheetByName(sheetName).appendRow(headers.map(h=>data[h]??''));audit_(sheetName,data.id,'crear',null,data,data.usuarioId);return data;}finally{lock.releaseLock();}}
function createTenant_(input){const tenant=create_('Inquilinos',input);const obligation=createTenantObligationIfNeeded_(tenant,input&&input.usuarioId);return {tenant,obligation};}
function update_(sheetName,input){const lock=LockService.getScriptLock();lock.waitLock(15000);try{const data=sanitize_(input),old=rows_(sheetName).find(x=>x.id===data.id);if(!old)throw new Error('Registro no encontrado');const merged={...old,...data,actualizadoEn:new Date().toISOString()};validate_(sheetName,merged);const sh=db_().getSheetByName(sheetName),headers=SCHEMA[sheetName];sh.getRange(old._row,1,1,headers.length).setValues([headers.map(h=>merged[h]??'')]);audit_(sheetName,data.id,'editar',old,merged,data.usuarioId);delete merged._row;return merged;}finally{lock.releaseLock();}}
function logicalDelete_(sheetName,input){if(!input.id)throw new Error('Falta id');return update_(sheetName,{id:input.id,estado:'eliminado',usuarioId:input.usuarioId});}
function audit_(entity,id,action,before,after,userId){const sh=db_().getSheetByName('Auditoria');sh.appendRow([Utilities.getUuid(),entity,id,action,JSON.stringify(before||{}),JSON.stringify(after||{}),userId||'',new Date().toISOString()]);}
function getDashboard_(p){const month=Number(p.month),year=Number(p.year);const all=list_('Movimientos',{}),items=all.filter(x=>{const d=new Date(x.fechaMovimiento);return d.getMonth()+1===month&&d.getFullYear()===year});const income=items.filter(x=>x.tipo==='ingreso').reduce((s,x)=>s+Number(x.monto),0),expense=items.filter(x=>x.tipo==='gasto').reduce((s,x)=>s+Number(x.monto),0);const available=all.reduce((s,x)=>s+(x.tipo==='ingreso'?Number(x.monto):-Number(x.monto)),0),obs=list_('ObligacionesMensuales',{});return {income,expense,balance:income-expense,available,count:items.length,pending:obs.reduce((s,x)=>s+Number(x.saldoPendiente||0),0),debtors:new Set(obs.filter(x=>Number(x.saldoPendiente)>0).map(x=>x.inquilinoId)).size,movements:items};}
function getTenantStatement_(p){const tenant=list_('Inquilinos',{id:p.inquilinoId})[0];if(!tenant)throw new Error('Inquilino no encontrado');return {tenant,obligations:list_('ObligacionesMensuales',{}).filter(x=>x.inquilinoId===p.inquilinoId),payments:list_('Movimientos',{}).filter(x=>x.inquilinoId===p.inquilinoId&&x.tipo==='ingreso')};}
function createMonthlyObligations_(p){const period=p.period;if(!/^\d{4}-\d{2}$/.test(period||''))throw new Error('Periodo inválido');const existing=list_('ObligacionesMensuales',{}),created=[];list_('Inquilinos',{}).filter(x=>x.estado==='activo').forEach(t=>{if(existing.some(o=>o.inquilinoId===t.id&&o.periodo===period))return;created.push(create_('ObligacionesMensuales',{inquilinoId:t.id,propiedadId:t.propiedadId,periodo,montoEsperado:Number(t.precioMensual),montoPagado:0,saldoPendiente:Number(t.precioMensual),estado:'pendiente',fechaVencimiento:period+'-'+String(t.diaPago||1).padStart(2,'0'),usuarioId:p.usuarioId}));});return created;}
function applyPayment_(p){const lock=LockService.getScriptLock();lock.waitLock(15000);try{const movement=list_('Movimientos',{id:p.movimientoId})[0],obligation=list_('ObligacionesMensuales',{id:p.obligacionId})[0],amount=Number(p.montoAplicado);if(!movement||movement.tipo!=='ingreso')throw new Error('Ingreso no encontrado');if(!obligation)throw new Error('Obligación no encontrada');if(!(amount>0))throw new Error('Monto inválido');const already=list_('AplicacionesPago',{}).filter(x=>x.movimientoId===p.movimientoId).reduce((s,x)=>s+Number(x.montoAplicado),0);if(already+amount>Number(movement.monto))throw new Error('El monto aplicado supera el ingreso');const now=new Date().toISOString(),app={id:Utilities.getUuid(),movimientoId:p.movimientoId,obligacionId:p.obligacionId,montoAplicado:amount,creadoEn:now};db_().getSheetByName('AplicacionesPago').appendRow(SCHEMA.AplicacionesPago.map(h=>app[h]??''));const paid=Number(obligation.montoPagado)+amount,balance=Math.max(0,Number(obligation.montoEsperado)-paid),updated={...obligation,montoPagado:paid,saldoPendiente:balance,estado:balance===0?'pagado':'parcial',actualizadoEn:now};db_().getSheetByName('ObligacionesMensuales').getRange(obligation._row,1,1,SCHEMA.ObligacionesMensuales.length).setValues([SCHEMA.ObligacionesMensuales.map(h=>updated[h]??'')]);audit_('ObligacionesMensuales',obligation.id,'aplicar_pago',obligation,updated,p.usuarioId);return app;}finally{lock.releaseLock();}}
function getReports_(p){return getDashboard_({month:Number(p.month)||new Date().getMonth()+1,year:Number(p.year)||new Date().getFullYear()});}
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function createTenantObligationIfNeeded_(tenant,usuarioId){
 if(!tenant||tenant.estado==='eliminado') return null;
 const amount=Number(tenant.precioMensual||0);
 if(!(amount>0)) return null;
 const period=getTenantInitialPeriod_(tenant);
 const existing=list_('ObligacionesMensuales',{}).find(x=>x.inquilinoId===tenant.id&&x.periodo===period);
 if(existing) return existing;
 return create_('ObligacionesMensuales',{
  inquilinoId:tenant.id,
  propiedadId:tenant.propiedadId,
  periodo:period,
  montoEsperado:amount,
  montoPagado:0,
  saldoPendiente:amount,
  estado:'pendiente',
  fechaVencimiento:period+'-'+String(normalizeDay_(tenant.diaPago)).padStart(2,'0'),
  usuarioId:usuarioId
 });
}
function getTenantInitialPeriod_(tenant){
 const start=String((tenant&&tenant.fechaInicio)||'').trim();
 if(/^\d{4}-\d{2}/.test(start)) return start.slice(0,7);
 return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM');
}
function normalizeDay_(day){
 const value=Math.floor(Number(day||1));
 return Math.min(31,Math.max(1,value||1));
}
