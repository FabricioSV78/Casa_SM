# Cloudflare Pages

Esta app ya esta lista para desplegarse en Cloudflare Pages como SPA de Vite.

## Configuracion recomendada

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: dejar vacio
- Node.js version: `20`

## Variables de entorno

Configura estas variables tanto en `Production` como en `Preview`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_PUBLISHABLE_KEY
VITE_APP_ACCESS_KEY=111943
VITE_USE_MOCKS=false
NODE_VERSION=20
```

## Archivos de soporte ya incluidos

- `public/_redirects`: reescribe cualquier ruta a `index.html` para que React Router funcione.
- `public/_headers`: agrega encabezados basicos y cache largo para `/assets/*`.

## Checklist antes del deploy

1. Confirmar que Supabase ya tiene las tablas y usuarios base.
2. Confirmar que `.env` local funciona.
3. Ejecutar `npm run build`.
4. Subir el repo a GitHub o GitLab.
5. Conectar el repo en Cloudflare Pages.
6. Cargar las variables de entorno.
7. Hacer el primer deploy.

## Si algo falla en produccion

- Si la app abre en blanco: revisar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` existan en Pages.
- Si al recargar una ruta sale 404: verificar que `_redirects` este presente en el deploy.
- Si el login responde `Usuario no encontrado`: revisar la tabla `usuarios` en Supabase.
