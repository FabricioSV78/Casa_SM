import {Loader2,X} from 'lucide-react'
import {statusStyles} from '../constants/options'

export function PageHeader({title,description,action}){return <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{description&&<p className="mt-1 text-stone-500">{description}</p>}</div>{action}</div>}

export function StatCard({label,value,icon:Icon,color='brand',hint}){const colors={brand:'bg-brand-100 text-brand-700',green:'bg-emerald-100 text-emerald-700',red:'bg-red-100 text-red-700',blue:'bg-sky-100 text-sky-700',violet:'bg-violet-100 text-violet-700'};return <div className="card p-4 sm:p-5"><div className={`mb-4 inline-flex rounded-xl p-2.5 ${colors[color]}`}><Icon size={22}/></div><p className="text-sm font-medium text-stone-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p>{hint&&<p className="mt-1 text-xs text-stone-400">{hint}</p>}</div>}

export function Badge({status}){return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[status]||'bg-stone-100 text-stone-700'}`}>{status}</span>}

export function Modal({title,onClose,children,size='max-w-2xl'}){return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-2xl sm:rounded-3xl sm:p-6 ${size}`}><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} className="rounded-full p-2 hover:bg-stone-200" aria-label="Cerrar"><X/></button></div>{children}</div></div>}

export function Empty({title='No hay informacion',text='Los registros apareceran aqui.'}){return <div className="card px-5 py-12 text-center"><p className="font-bold">{title}</p><p className="mt-1 text-stone-500">{text}</p></div>}

export function Field({label,error,children}){return <label className="block"><span className="label">{label}</span>{children}{error&&<span className="mt-1 block text-sm text-red-600">{error.message}</span>}</label>}

export function Spinner({size=22,className=''}){return <Loader2 size={size} className={`animate-spin ${className}`}/>}

export function ProcessingOverlay({show,message='Procesando solicitud...'}){if(!show)return null;return <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/20 p-4 backdrop-blur-[2px]"><div className="card flex w-full max-w-xs items-center gap-3 p-4 shadow-2xl"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><Spinner/></div><div><p className="font-bold">Espere un momento</p><p className="text-sm text-stone-500">{message}</p></div></div></div>}
