# Cloudflare Pages

Esta app ya esta lista para desplegarse en Cloudflare Pages como SPA de Vite.

Importante: crea un proyecto de **Pages**, no un **Worker**. Si en Cloudflare ves `Deploy command: npx wrangler deploy`, estas en la configuracion de Worker y este proyecto no debe desplegarse por ese camino.

## Configuracion recomendada

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: dejar vacio
- Node.js version: `20`
- Deploy command: dejar vacio / no aplica en Pages

## Variables de entorno

Configura estas variables tanto en `Production` como en `Preview`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_PUBLISHABLE_KEY
VITE_ADMIN_ACCESS_KEY=71539917
VITE_OWNER_ACCESS_KEY=111943
VITE_INITIAL_ACCOUNT_BALANCE=9400.78
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

## Activar Web Analytics

Cloudflare Pages no siempre aparece automaticamente en **Web Analytics** apenas se crea el deploy. Para activarlo:

1. Entra a **Workers & Pages**.
2. Selecciona tu proyecto de **Pages**.
3. Abre **Metrics**.
4. En **Web Analytics**, selecciona **Enable**.
5. Ejecuta un nuevo deploy para que Cloudflare inyecte el script de analytics.
6. Abre la URL publicada y navega algunas pantallas para generar visitas.

Los datos pueden tardar unos minutos en aparecer. Si usas bloqueadores de anuncios o privacidad, prueba tambien desde una ventana sin extensiones.

## Error comun: wrangler deploy

Si el log muestra algo parecido a esto:

```text
Deploy command: npx wrangler deploy
@cloudflare/vite-plugin
SyntaxError: The requested module 'node:module' does not provide an export named 'registerHooks'
```

Ese deploy se creo como **Worker**, no como **Pages**.

Para corregirlo:

1. Vuelve a Cloudflare.
2. Entra a **Workers & Pages**.
3. Selecciona **Create application**.
4. Elige **Pages**, no Worker.
5. Conecta el mismo repositorio.
6. Usa `npm run build` como build command.
7. Usa `dist` como output directory.
8. No configures `npx wrangler deploy`.

## Si algo falla en produccion

- Si la app abre en blanco: revisar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` existan en Pages.
- Si al recargar una ruta sale 404: verificar que `_redirects` este presente en el deploy.
- Si el login responde `Usuario no encontrado`: revisar la tabla `usuarios` en Supabase.
