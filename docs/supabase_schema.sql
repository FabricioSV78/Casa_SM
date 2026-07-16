create extension if not exists pgcrypto;

create table if not exists public.usuarios (
 id text primary key default gen_random_uuid()::text,
 nombre text not null,
 usuario text not null,
 rol text not null check (rol in ('administradora','propietaria')),
 estado text not null default 'activo',
 creado_en timestamptz not null default now()
);

create table if not exists public.propiedades (
 id text primary key default gen_random_uuid()::text,
 codigo text not null unique,
 nombre text,
 tipo text,
 ubicacion text,
 precio_referencial numeric(12,2) default 0,
 estado text not null default 'disponible',
 inquilino_actual_id text,
 observaciones text,
 creado_en timestamptz not null default now(),
 actualizado_en timestamptz not null default now()
);

create table if not exists public.inquilinos (
 id text primary key default gen_random_uuid()::text,
 nombre text not null,
 documento text,
 celular text,
 correo text,
 tipo text default 'persona',
 propiedad_id text references public.propiedades(id) on delete set null,
 fecha_inicio date,
 precio_mensual numeric(12,2) default 0,
 dia_pago integer check (dia_pago is null or (dia_pago between 1 and 31)),
 garantia numeric(12,2) default 0,
 estado text not null default 'activo',
 observaciones text,
 creado_en timestamptz not null default now(),
 actualizado_en timestamptz not null default now()
);

do $$
begin
 if not exists (
  select 1
  from pg_constraint
  where conname = 'propiedades_inquilino_actual_id_fkey'
 ) then
  alter table public.propiedades
   add constraint propiedades_inquilino_actual_id_fkey
   foreign key (inquilino_actual_id) references public.inquilinos(id) on delete set null;
 end if;
end $$;

create table if not exists public.inquilinos_propiedades (
 id text primary key default gen_random_uuid()::text,
 inquilino_id text not null references public.inquilinos(id) on delete cascade,
 propiedad_id text not null references public.propiedades(id) on delete cascade,
 creado_en timestamptz not null default now(),
 unique (inquilino_id, propiedad_id),
 unique (propiedad_id)
);

insert into public.inquilinos_propiedades (inquilino_id,propiedad_id)
select id,propiedad_id
from public.inquilinos
where propiedad_id is not null
on conflict (propiedad_id) do nothing;

update public.propiedades as propiedad
set estado='ocupada',
    inquilino_actual_id=asignacion.inquilino_id,
    actualizado_en=now()
from public.inquilinos_propiedades as asignacion
where propiedad.id=asignacion.propiedad_id;

create or replace function public.sincronizar_ocupacion_propiedad()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
 if tg_op='DELETE' then
  update public.propiedades
  set estado=case when estado='eliminado' then estado else 'disponible' end,
      inquilino_actual_id=null,
      actualizado_en=now()
  where id=old.propiedad_id
    and inquilino_actual_id=old.inquilino_id;
  return old;
 end if;

 update public.propiedades
 set estado='ocupada',
     inquilino_actual_id=new.inquilino_id,
     actualizado_en=now()
 where id=new.propiedad_id;
 return new;
end;
$$;

drop trigger if exists trg_sincronizar_ocupacion_propiedad on public.inquilinos_propiedades;
create trigger trg_sincronizar_ocupacion_propiedad
after insert or delete on public.inquilinos_propiedades
for each row execute function public.sincronizar_ocupacion_propiedad();

create table if not exists public.movimientos (
 id text primary key default gen_random_uuid()::text,
 tipo text not null check (tipo in ('ingreso','gasto')),
 fecha_movimiento date not null,
 monto numeric(12,2) not null check (monto > 0),
 categoria text,
 concepto text not null,
 inquilino_id text references public.inquilinos(id) on delete set null,
 propiedad_id text references public.propiedades(id) on delete set null,
 metodo_pago text,
 tipo_pago text,
 periodos_relacionados text,
 observaciones text,
 usuario_id text references public.usuarios(id) on delete set null,
 creado_en timestamptz not null default now(),
 actualizado_en timestamptz not null default now(),
 estado text not null default 'activo'
);

create table if not exists public.movimientos_propiedades (
 id text primary key default gen_random_uuid()::text,
 movimiento_id text not null references public.movimientos(id) on delete cascade,
 propiedad_id text not null references public.propiedades(id) on delete cascade,
 creado_en timestamptz not null default now(),
 unique (movimiento_id, propiedad_id)
);

insert into public.movimientos_propiedades (movimiento_id,propiedad_id)
select id,propiedad_id
from public.movimientos
where propiedad_id is not null
on conflict (movimiento_id,propiedad_id) do nothing;

create table if not exists public.obligaciones_mensuales (
 id text primary key default gen_random_uuid()::text,
 inquilino_id text references public.inquilinos(id) on delete cascade,
 propiedad_id text references public.propiedades(id) on delete set null,
 periodo text not null check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
 monto_esperado numeric(12,2) not null default 0,
 monto_pagado numeric(12,2) not null default 0,
 saldo_pendiente numeric(12,2) not null default 0,
 estado text not null default 'pendiente',
 fecha_vencimiento date,
 creado_en timestamptz not null default now(),
 actualizado_en timestamptz not null default now(),
 unique (inquilino_id, periodo)
);

create table if not exists public.aplicaciones_pago (
 id text primary key default gen_random_uuid()::text,
 movimiento_id text references public.movimientos(id) on delete cascade,
 obligacion_id text references public.obligaciones_mensuales(id) on delete cascade,
 monto_aplicado numeric(12,2) not null check (monto_aplicado > 0),
 creado_en timestamptz not null default now()
);

create table if not exists public.categorias (
 id text primary key default gen_random_uuid()::text,
 tipo text not null check (tipo in ('ingreso','gasto')),
 nombre text not null,
 estado text not null default 'activo'
);

create table if not exists public.auditoria (
 id text primary key default gen_random_uuid()::text,
 entidad text not null,
 entidad_id text,
 accion text not null,
 datos_anteriores jsonb default '{}'::jsonb,
 datos_nuevos jsonb default '{}'::jsonb,
 usuario_id text references public.usuarios(id) on delete set null,
 fecha timestamptz not null default now()
);

create index if not exists idx_movimientos_fecha on public.movimientos(fecha_movimiento);
create index if not exists idx_movimientos_estado on public.movimientos(estado);
create index if not exists idx_movimientos_inquilino on public.movimientos(inquilino_id);
create index if not exists idx_inquilinos_propiedades_inquilino on public.inquilinos_propiedades(inquilino_id);
create index if not exists idx_movimientos_propiedades_movimiento on public.movimientos_propiedades(movimiento_id);
create index if not exists idx_obligaciones_inquilino on public.obligaciones_mensuales(inquilino_id);
create index if not exists idx_obligaciones_periodo on public.obligaciones_mensuales(periodo);

insert into public.usuarios (id,nombre,usuario,rol,estado)
values
 ('u1','Karla','admin','administradora','activo'),
 ('u2','Ada','propietaria','propietaria','activo')
on conflict (id) do update set
 nombre=excluded.nombre,
 usuario=excluded.usuario,
 rol=excluded.rol,
 estado=excluded.estado;

insert into public.categorias (tipo,nombre,estado)
values
 ('ingreso','Alquiler','activo'),
 ('ingreso','Garantia','activo'),
 ('ingreso','Servicio','activo'),
 ('gasto','Luz','activo'),
 ('gasto','Agua','activo'),
 ('gasto','Internet','activo'),
 ('gasto','Mantenimiento','activo'),
 ('gasto','Reparacion','activo'),
 ('gasto','Impuestos','activo')
on conflict do nothing;

-- Direct React mode:
-- The current app uses the public anon key directly from the browser.
-- Leave RLS disabled for these tables, or create permissive anon policies,
-- otherwise the frontend will not be able to read/write data.
alter table public.usuarios disable row level security;
alter table public.inquilinos disable row level security;
alter table public.inquilinos_propiedades disable row level security;
alter table public.propiedades disable row level security;
alter table public.movimientos disable row level security;
alter table public.movimientos_propiedades disable row level security;
alter table public.obligaciones_mensuales disable row level security;
alter table public.aplicaciones_pago disable row level security;
alter table public.categorias disable row level security;
alter table public.auditoria disable row level security;
