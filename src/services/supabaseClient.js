import {createClient} from '@supabase/supabase-js'

const supabaseUrl=(import.meta.env.VITE_SUPABASE_URL||'').trim()
const supabaseAnonKey=(import.meta.env.VITE_SUPABASE_ANON_KEY||'').trim()

export const hasSupabaseConfig=/^https?:\/\//.test(supabaseUrl)&&Boolean(supabaseAnonKey)
export const usingMocks=!hasSupabaseConfig||import.meta.env.VITE_USE_MOCKS==='true'

export const supabase=hasSupabaseConfig
 ? createClient(supabaseUrl,supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false}})
 : null

export function requireSupabase(){
 if(!supabase)throw new Error('Supabase no configurado. Revise VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
 return supabase
}
