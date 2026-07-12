import {Loader2,X} from 'lucide-react'
import {statusStyles} from '../constants/options'

export function PageHeader({title,description,action}){return <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><h1 className="break-words text-2xl font-bold sm:text-3xl">{title}</h1>{description&&<p className="mt-1 break-words text-sm text-stone-500 sm:text-base">{description}</p>}</div>{action&&<div className="flex w-full shrink-0 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">{action}</div>}</div>}

export function StatCard({label,value,icon:Icon,color='brand',hint}){const colors={brand:'bg-brand-100 text-brand-700',green:'bg-emerald-100 text-emerald-700',red:'bg-red-100 text-red-700',blue:'bg-sky-100 text-sky-700',violet:'bg-violet-100 text-violet-700'};return <div className="card flex min-h-32 flex-col p-3.5 sm:min-h-0 sm:p-5"><div className={`mb-3 inline-flex w-fit rounded-xl p-2 sm:mb-4 sm:p-2.5 ${colors[color]}`}><Icon size={20}/></div><p className="text-xs font-medium leading-snug text-stone-500 sm:text-sm">{label}</p><p className="mt-1 break-words text-xl font-bold leading-tight sm:text-2xl">{value}</p>{hint&&<p className="mt-1 text-xs text-stone-400">{hint}</p>}</div>}

export function Badge({status}){return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[status]||'bg-stone-100 text-stone-700'}`}>{status}</span>}

export function Modal({title,onClose,children,size='max-w-2xl'}){return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className={`max-h-[calc(100dvh-1rem)] w-full min-w-0 overflow-y-auto overscroll-contain rounded-t-2xl bg-cream px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl sm:max-h-[92vh] sm:rounded-2xl sm:p-6 ${size}`}><div className="sticky top-0 z-10 mb-4 flex min-w-0 items-center justify-between gap-3 bg-cream pb-2 sm:static sm:mb-5 sm:pb-0"><h2 className="min-w-0 break-words text-lg font-bold sm:text-xl">{title}</h2><button onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-stone-200" aria-label="Cerrar"><X/></button></div>{children}</div></div>}

export function Empty({title='No hay informacion',text='Los registros apareceran aqui.'}){return <div className="card px-4 py-9 text-center sm:px-5 sm:py-12"><p className="font-bold">{title}</p><p className="mt-1 text-sm text-stone-500 sm:text-base">{text}</p></div>}

export function Field({label,error,children}){return <label className="block"><span className="label">{label}</span>{children}{error&&<span className="mt-1 block text-sm text-red-600">{error.message}</span>}</label>}

export function Spinner({size=22,className=''}){return <Loader2 size={size} className={`animate-spin ${className}`}/>}

export function ProcessingOverlay({show,message='Procesando solicitud...'}){if(!show)return null;return <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/20 p-4 backdrop-blur-[2px]"><div className="card flex w-full max-w-xs items-center gap-3 p-4 shadow-2xl"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><Spinner/></div><div className="min-w-0"><p className="font-bold">Espere un momento</p><p className="break-words text-sm text-stone-500">{message}</p></div></div></div>}
