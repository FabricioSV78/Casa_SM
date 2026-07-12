# Cuartos ADI

Aplicacion web responsive para administrar ingresos, gastos, inquilinos, habitaciones y oficinas.

## Funcionalidad incluida

- Login por rol: administradora con edicion y propietaria con solo lectura.
- Dashboard mensual con ingresos, gastos, saldo, disponible y ocupacion.
- Registro de ingresos y gastos con validaciones.
- Historial de movimientos con busqueda, filtros, eliminacion logica y descarga CSV.
- Gestion de inquilinos, empresas y espacios.
- Reportes generales y datos demo como respaldo local.
- Persistencia en Supabase.

## Ejecutar localmente

Requiere Node.js 20 o posterior.

```bash
npm install
copy .env.example .env
npm run dev
```

Abra la URL que muestra Vite. La clave por defecto para administradora y propietaria es `111943`.

Si `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` estan vacios, la app usa los datos de `src/data/mockData.js` como respaldo local.

## Configurar Supabase

1. Cree un proyecto en Supabase.
2. Ejecute el SQL de [`docs/supabase_schema.sql`](docs/supabase_schema.sql) en **SQL Editor**.
3. Copie **Project URL** y **Publishable key** desde **Project Settings > API Keys**.
4. Configure `.env`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_APP_ACCESS_KEY=111943
VITE_USE_MOCKS=false
```

5. Reinicie Vite.

La guia completa esta en [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

## Seguridad

La version actual se conecta directo desde React con la `anon key` de Supabase. Es suficiente para uso interno/prototipo, pero no debe considerarse seguridad fuerte para datos sensibles. Para produccion, migre permisos a Supabase Auth, Edge Functions o RPCs `security definer`, y active RLS con politicas por usuario/rol.

Nunca coloque la `service_role key` en `.env` de React.

## Estructura

```text
src/
  components/   Componentes reutilizables
  constants/    Opciones y estilos de estados
  context/      Sesion y estado global
  data/         Datos ficticios
  layouts/      Navegacion de escritorio y movil
  pages/        Vistas principales
  services/     Cliente y servicio Supabase
  utils/        Moneda, fechas e IDs
apps-script/    Backend legado de Google Apps Script
docs/           SQL y guias de configuracion
```

## Desplegar en Cloudflare Pages

1. Suba el proyecto a un repositorio Git.
2. En Cloudflare, abra **Workers & Pages > Create > Pages > Connect to Git**.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Agregue `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ACCESS_KEY`, `VITE_USE_MOCKS=false` y `NODE_VERSION=20`.
7. Despliegue.

La guia detallada esta en [`docs/CLOUDFLARE_PAGES.md`](docs/CLOUDFLARE_PAGES.md).

`public/_redirects` permite que React Router funcione al abrir rutas directamente y `public/_headers` agrega encabezados basicos para Pages.
