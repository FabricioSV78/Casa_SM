import {createContext,useContext,useEffect,useMemo,useRef,useState} from 'react'
import {movements as initialMovements,tenants as initialTenants,properties as initialProperties,users} from '../data/mockData'
import {uid} from '../utils/format'
import {dataService} from '../services/dataService'

const Context=createContext(null)
const ADMIN_ACCESS_KEY=import.meta.env.VITE_ADMIN_ACCESS_KEY||'71539917'
const OWNER_ACCESS_KEY=import.meta.env.VITE_OWNER_ACCESS_KEY||import.meta.env.VITE_APP_ACCESS_KEY||'111943'
const AUTH_VERSION='supabase-auth-v1'
const USER_KEY='cuartos-user'

const emptyData={movements:[],tenants:[],properties:[],obligations:[]}
const demoData={movements:initialMovements,tenants:initialTenants,properties:initialProperties,obligations:[]}

const readSavedUser=()=>{
 try{
  const saved=JSON.parse(sessionStorage.getItem(USER_KEY)||'null')
  return saved?.authVersion===AUTH_VERSION?saved:null
 }catch{
  return null
 }
}

export function AppProvider({children}){
 const [user,setUser]=useState(readSavedUser)
 const loadedTokenRef=useRef('')
 const initialData=dataService.usingMocks?demoData:emptyData
 const [movements,setMovements]=useState(initialData.movements)
 const [tenants,setTenants]=useState(initialData.tenants)
 const [properties,setProperties]=useState(initialData.properties)
 const [monthlyObligations,setMonthlyObligations]=useState(initialData.obligations)
 const [toast,setToast]=useState(null)
 const [processing,setProcessing]=useState({active:false,message:''})

 useEffect(()=>{
  if(dataService.usingMocks||!user?.token)return
  if(loadedTokenRef.current===user.token)return
  dataService.setToken(user.token)
  loadRemoteData({showProcessing:true}).catch(e=>{
   notify(e.message,'error')
   if(/sesión|token|permiso|autoriz/i.test(e.message)) logout()
  })
 },[user?.token])

 const persistUser=sessionUser=>{
  setUser(sessionUser)
  sessionStorage.setItem(USER_KEY,JSON.stringify(sessionUser))
 }

 const clearRemoteData=()=>{
  if(dataService.usingMocks)return
  setMovements([])
  setTenants([])
  setProperties([])
  setMonthlyObligations([])
 }

 const loadRemoteData=async({showProcessing=false}={})=>{
  if(dataService.usingMocks)return
  if(showProcessing)setProcessing({active:true,message:'Cargando datos de Supabase...'})
  try{
   const [m,t,p,o]=await Promise.all([dataService.movements({}),dataService.tenants(),dataService.properties(),dataService.obligations()])
   setMovements(m)
   setTenants(t)
   setProperties(p)
   setMonthlyObligations(o)
  }finally{
   if(showProcessing)setProcessing({active:false,message:''})
  }
 }

 const login=async(role,password)=>{
  if(dataService.usingMocks){
   const expectedKey=role==='administradora'?ADMIN_ACCESS_KEY:OWNER_ACCESS_KEY
   if(password!==expectedKey)return false
   const found=users.find(u=>u.rol===role)
   if(!found)return false
   persistUser({...found,authVersion:AUTH_VERSION})
   return true
  }
  const session=await dataService.login(role,password)
  const sessionUser={...session.user,token:session.token,expiresAt:session.expiresAt,authVersion:AUTH_VERSION}
  dataService.setToken(session.token)
  await loadRemoteData()
  loadedTokenRef.current=session.token
  persistUser(sessionUser)
  return true
 }

 const logout=()=>{
  dataService.setToken('')
  loadedTokenRef.current=''
  setUser(null)
  sessionStorage.removeItem(USER_KEY)
  clearRemoteData()
 }

 const notify=(message,type='success')=>{
  setToast({message,type})
  setTimeout(()=>setToast(null),3000)
 }

 const addMovement=async data=>{
  const draft={...data,id:uid('mov'),monto:Number(data.monto),usuarioId:user.id,estado:'activo',creadoEn:new Date().toISOString()}
  setProcessing({active:true,message:'Guardando movimiento...'})
  try{
   const saved=dataService.usingMocks?draft:await dataService.createMovement(draft)
   setMovements(v=>[saved,...v])
   notify('Movimiento registrado correctamente')
   return saved
  }catch(e){
   notify(e.message,'error')
   throw e
  }finally{
   setProcessing({active:false,message:''})
  }
 }

 const removeMovement=async id=>{
  setProcessing({active:true,message:'Eliminando movimiento...'})
  try{
   if(!dataService.usingMocks)await dataService.deleteMovement(id,user.id)
   setMovements(v=>v.map(x=>x.id===id?{...x,estado:'eliminado'}:x))
   notify('Movimiento eliminado','error')
  }catch(e){
   notify(e.message,'error')
   throw e
  }finally{
   setProcessing({active:false,message:''})
  }
 }

 const addTenant=async data=>{
  const draft={...data,id:uid('inq'),precioMensual:Number(data.precioMensual),usuarioId:user.id,estado:'activo'}
  setProcessing({active:true,message:'Guardando inquilino...'})
  try{
   const saved=dataService.usingMocks?draft:await dataService.createTenant(draft)
   setTenants(v=>[...v,saved])
   notify('Inquilino guardado')
   return saved
  }catch(e){
   notify(e.message,'error')
   throw e
  }finally{
   setProcessing({active:false,message:''})
  }
 }

 const removeTenant=async tenant=>{
  setProcessing({active:true,message:'Eliminando inquilino...'})
  try{
   let releasedProperty=null
   if(!dataService.usingMocks){
    const result=await dataService.deleteTenant(tenant.id,user.id)
    releasedProperty=result?.property||null
   }
   setTenants(v=>v.map(item=>item.id===tenant.id?{...item,estado:'eliminado'}:item))
   if(tenant.propiedadId){
    setProperties(v=>v.map(item=>item.id===tenant.propiedadId?{...item,estado:'disponible',inquilinoActualId:null,...(releasedProperty||{})}:item))
   }
   notify('Inquilino eliminado')
  }catch(e){
   notify(e.message,'error')
   throw e
  }finally{
   setProcessing({active:false,message:''})
  }
 }

 const addProperty=async data=>{
  const draft={...data,id:uid('prop'),precioReferencial:Number(data.precioReferencial),usuarioId:user.id,estado:data.estado||'disponible'}
  setProcessing({active:true,message:'Guardando espacio...'})
  try{
   const saved=dataService.usingMocks?draft:await dataService.createProperty(draft)
   setProperties(v=>[...v,saved])
   notify('Espacio guardado')
   return saved
  }catch(e){
   notify(e.message,'error')
   throw e
  }finally{
   setProcessing({active:false,message:''})
  }
 }

 const removeProperty=async property=>{
  setProcessing({active:true,message:'Eliminando espacio...'})
  try{
   let updatedTenants=[]
   if(!dataService.usingMocks){
    const result=await dataService.deleteProperty(property.id,user.id)
    updatedTenants=result?.tenants||[]
   }
   setProperties(v=>v.map(item=>item.id===property.id?{...item,estado:'eliminado',inquilinoActualId:null}:item))
   if(updatedTenants.length){
    const updatedById=new Map(updatedTenants.map(item=>[item.id,item]))
    setTenants(v=>v.map(item=>updatedById.get(item.id)||item))
   }else{
    setTenants(v=>v.map(item=>item.propiedadId===property.id?{...item,propiedadId:null}:item))
   }
   notify('Espacio eliminado')
  }catch(e){
   notify(e.message,'error')
   throw e
  }finally{
   setProcessing({active:false,message:''})
  }
 }

 const value=useMemo(()=>({user,login,logout,movements,tenants,properties,obligations:monthlyObligations,addMovement,removeMovement,addTenant,removeTenant,addProperty,removeProperty,toast,notify,processing:processing.active,processingMessage:processing.message,isAdmin:user?.rol==='administradora'}),[user,movements,tenants,properties,monthlyObligations,toast,processing])
 return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useApp=()=>useContext(Context)
