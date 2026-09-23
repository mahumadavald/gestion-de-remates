-- Tabla garantías — ejecutar en Supabase SQL Editor
-- Guarda las garantías de inscripción de postores por remate

create table if not exists garantias (
  id            uuid primary key default gen_random_uuid(),
  casa_id       uuid references casas(id),
  remate_id     uuid references remates(id),
  remate        text,
  postor        text not null,
  rut           text not null,
  email         text,
  telefono      text,
  metodo        text default 'Transferencia electrónica',
  monto         integer default 300000,
  comprobante_url text,
  paleta        text,
  cuenta_banco  text,
  estado        text default 'pendiente' check (estado in ('pendiente','aprobada','devuelta')),
  devolucion    text,
  created_at    timestamptz default now()
);

-- Política RLS: cada casa solo ve sus garantías
alter table garantias enable row level security;

create policy "garantias_casa"
  on garantias for all
  using (casa_id = (select casa_id from usuarios where id = auth.uid()));

-- Columna retiro en liquidaciones (si no existe)
alter table liquidaciones add column if not exists retiro text;

-- Índices
create index if not exists garantias_casa_id on garantias(casa_id);
create index if not exists garantias_remate_id on garantias(remate_id);
create index if not exists garantias_estado on garantias(estado);
