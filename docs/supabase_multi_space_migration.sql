create extension if not exists pgcrypto;

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

create index if not exists idx_inquilinos_propiedades_inquilino
 on public.inquilinos_propiedades(inquilino_id);

create index if not exists idx_movimientos_propiedades_movimiento
 on public.movimientos_propiedades(movimiento_id);

alter table public.inquilinos_propiedades disable row level security;
alter table public.movimientos_propiedades disable row level security;
