import {useState} from 'react'
import {Building2,Eye,KeyRound,ShieldCheck} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {Spinner} from '../components/ui'

const roles=[
 {value:'administradora',title:'Administradora',text:'Puede registrar y modificar',Icon:ShieldCheck},
 {value:'propietaria',title:'Propietaria',text:'Solo consulta la informacion',Icon:Eye}
]

export default function LoginPage(){
 const {login}=useApp()
 const [role,setRole]=useState('administradora')
 const [password,setPassword]=useState('')
 const [error,setError]=useState('')
 const [loading,setLoading]=useState(false)

 const handleSubmit=async e=>{
  e.preventDefault()
  setLoading(true)
  try{
   const ok=await login(role,password)
   if(!ok){
    setError('Clave incorrecta. Intente nuevamente.')
    setPassword('')
   }
  }catch(err){
   setError(err.message||'No se pudo iniciar sesión.')
  }finally{
   setLoading(false)
  }
 }

 return <main className="grid min-h-screen min-h-[100dvh] place-items-center bg-gradient-to-br from-brand-50 via-cream to-emerald-50 px-3 py-5 min-[380px]:px-4 sm:py-8">
  <div className="w-full max-w-md">
   <div className="mb-5 text-center sm:mb-7">
    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white"><Building2/></div>
    <h1 className="text-2xl font-bold sm:text-3xl">Cuartos ADI</h1>
    <p className="mt-2 text-sm text-stone-500 sm:text-base">Control simple y claro de sus alquileres</p>
   </div>
   <form onSubmit={handleSubmit} className="card p-4 min-[380px]:p-5 sm:p-6">
    <h2 className="text-xl font-bold">Ingresar</h2>
    <p className="mt-1 text-sm text-stone-500">Elija su perfil e ingrese la clave de acceso.</p>
    <div className="mt-5 grid gap-3">
     {roles.map(({value,title,text,Icon})=><button key={value} type="button" onClick={()=>{setRole(value);setError('')}} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left min-[380px]:p-4 ${role===value?'border-brand-500 bg-brand-50 ring-2 ring-brand-100':'border-stone-200 bg-white'}`}>
      <Icon className="text-brand-700"/>
      <span className="min-w-0"><b className="block">{title}</b><span className="block break-words text-sm text-stone-500">{text}</span></span>
     </button>)}
    </div>
    <label className="mt-5 block text-sm font-semibold text-stone-700" htmlFor="password">Clave</label>
    <div className="mt-2 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
     <KeyRound size={19} className="text-stone-400"/>
     <input id="password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}} type="password" inputMode="numeric" autoComplete="current-password" className="min-w-0 flex-1 bg-transparent py-3 outline-none" placeholder="Ingrese su clave"/>
    </div>
    {error&&<p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
    <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">{loading&&<Spinner size={18}/>} {loading?'Ingresando...':'Continuar'}</button>
    <p className="mt-4 text-center text-xs text-stone-400">La clave es requerida para ambos perfiles.</p>
   </form>
  </div>
 </main>
}
