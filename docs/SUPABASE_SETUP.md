# Configuracion de Supabase

La app ya no usa Google Sheets ni Apps Script. Ahora lee y escribe desde Supabase usando `@supabase/supabase-js`.

## 1. Crear proyecto

1. Entra a Supabase y crea un proyecto.
2. Abre **SQL Editor**.
3. Copia y ejecuta completo el archivo [`docs/supabase_schema.sql`](./supabase_schema.sql).
4. Verifica en **Table Editor** que existan estas tablas:
   `usuarios`, `inquilinos`, `propiedades`, `movimientos`, `obligaciones_mensuales`, `aplicaciones_pago`, `categorias`, `auditoria`.

El SQL tambien crea los usuarios base:

- Administradora: `Karla`, rol `administradora`
- Propietaria: `Ada`, rol `propietaria`

Las claves de acceso por defecto son:

- Administradora: `71539917`, configurada con `VITE_ADMIN_ACCESS_KEY`
- Propietaria: `111943`, configurada con `VITE_OWNER_ACCESS_KEY`

## 2. Obtener credenciales

En Supabase abre **Project Settings > API** y copia:

- **Project URL** para `VITE_SUPABASE_URL`
- **anon public** para `VITE_SUPABASE_ANON_KEY`

No uses la key `service_role` en `.env`; esa key nunca debe ir al navegador.

## 3. Configurar `.env`

Edita `.env`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_ADMIN_ACCESS_KEY=71539917
VITE_OWNER_ACCESS_KEY=111943
VITE_INITIAL_ACCOUNT_BALANCE=9400.78
VITE_USE_MOCKS=false
```

Reinicia Vite despues de cambiar variables:

```bash
npm run dev
```

## 4. Seguridad importante

Esta migracion deja la app conectandose directo desde React con la `anon key`. Eso sirve para una app interna/prototipo y reemplaza Google Sheets, pero no es seguridad fuerte: alguien con conocimientos tecnicos podria inspeccionar el frontend y llamar la API de Supabase.

Para produccion con datos sensibles, el siguiente paso recomendado es mover login y permisos a Supabase Auth, Edge Functions o RPCs `security definer`, y activar RLS con politicas por usuario/rol.

## 5. Cargar datos

Puedes crear datos desde la misma app una vez conectado Supabase. Si ya tienes datos en Google Sheets:

1. Exporta cada hoja como CSV.
2. En Supabase abre la tabla equivalente.
3. Usa **Insert > Import data from CSV**.
4. Respeta estos cambios de nombre:

| Google Sheets | Supabase |
|---|---|
| Usuarios | usuarios |
| Inquilinos | inquilinos |
| Propiedades | propiedades |
| Movimientos | movimientos |
| ObligacionesMensuales | obligaciones_mensuales |
| AplicacionesPago | aplicaciones_pago |
| Categorias | categorias |
| Auditoria | auditoria |

Las columnas pasan de camelCase a snake_case. Ejemplos: `propiedadId` -> `propiedad_id`, `fechaMovimiento` -> `fecha_movimiento`, `saldoPendiente` -> `saldo_pendiente`.
