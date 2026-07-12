import {NavLink,useLocation} from 'react-router-dom'
import {ArrowLeftRight,Building2,FileBarChart,Home,LayoutDashboard,LogOut,Plus,Users} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {ProcessingOverlay} from '../components/ui'

const items=[['/','Resumen',LayoutDashboard],['/movimientos','Movimientos',ArrowLeftRight],['/inquilinos','Inquilinos',Users],['/espacios','Espacios',Building2],['/reportes','Reportes',FileBarChart]]

export default function AppLayout({children}){
 const {user,logout,toast,isAdmin,processing,processingMessage}=useApp()
 const loc=useLocation()

 return <div className="min-h-screen md:flex">
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#28352f] p-5 text-white md:flex">
   <div className="mb-10 flex items-center gap-3"><div className="rounded-xl bg-brand-500 p-2"><Home/></div><div><p className="font-bold">Cuartos ADI</p><p className="text-xs text-white/60">Control de alquileres</p></div></div>
   <nav className="space-y-1">{items.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-3 font-medium ${isActive?'bg-white text-ink':'text-white/75 hover:bg-white/10'}`}><Icon size={20}/>{label}</NavLink>)}</nav>
   <div className="mt-auto border-t border-white/10 pt-4"><p className="text-sm font-semibold">{user.nombre}</p><p className="text-xs capitalize text-white/60">{user.rol}</p><button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-white/70"><LogOut size={17}/> Cerrar sesion</button></div>
  </aside>
  <main className="min-w-0 flex-1 pb-24 md:ml-64 md:pb-0">
   <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-cream/90 px-4 backdrop-blur md:px-8">
    <div><p className="text-xs text-stone-500">Bienvenida</p><p className="font-semibold">{user.nombre.split(' ')[0]}</p></div>
    {isAdmin&&<NavLink to="/movimientos/nuevo" className="btn-primary !py-2.5"><Plus size={18}/> <span className="hidden sm:inline">Nuevo movimiento</span></NavLink>}
   </header>
   <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">{children}</div>
  </main>
  <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-stone-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] md:hidden">{items.slice(0,5).map(([to,label,Icon])=>{const active=to==='/'?loc.pathname==='/':loc.pathname.startsWith(to);return <NavLink key={to} to={to} className={`flex flex-col items-center gap-1 py-2 text-[11px] font-semibold ${active?'text-brand-700':'text-stone-500'}`}><Icon size={22}/>{label}</NavLink>})}</nav>
  {toast&&<div className={`fixed right-4 top-20 z-[60] rounded-xl px-4 py-3 font-semibold text-white shadow-xl ${toast.type==='error'?'bg-red-600':'bg-emerald-700'}`}>{toast.message}</div>}
  <ProcessingOverlay show={processing} message={processingMessage}/>
 </div>
}
