-- Tabla actas_recepcion_vehiculos — ejecutar en Supabase SQL Editor
-- Registro digital del Acta de Recepción de Vehículos Motorizados (causas judiciales)

create table if not exists actas_recepcion_vehiculos (
  id                  uuid primary key default gen_random_uuid(),
  casa_id             uuid references casas(id),

  -- Identificación de la causa
  rol                 text,           -- ROL de la causa judicial
  caratulado          text,           -- nombre de la causa
  tribunal            text,

  -- Datos del vehículo
  tipo_vehiculo       text,
  anio_fabricacion    text,
  ppu                 text,           -- patente
  marca               text,
  chasis              text,
  color               text,
  modelo              text,
  fecha_llegada       date,
  combustible_tipo    text,           -- bencina / diesel / eléctrico / gas
  motor_numero        text,
  kilometraje         integer,
  transmision         text,           -- manual / automatico

  -- Estado documentación (jsonb: {permiso_circulacion:{tiene:bool,vigente:bool}, ...})
  documentacion       jsonb default '{}'::jsonb,

  -- Accesorios (jsonb: {parachoques_delantero:bool, ...})
  accesorios          jsonb default '{}'::jsonb,

  -- Estado general
  estado_neumaticos   text,           -- bueno / regular / malo
  estado_pintura      text,           -- bueno / regular / malo
  marca_bateria       text,
  marca_neumaticos    text,
  nivel_combustible   text,           -- vacío / 1/4 / 1/2 / 3/4 / lleno
  observaciones       text,
  diagrama_daños      text,           -- notas de daños visibles

  -- Firmas
  entrega_nombre      text,
  entrega_rut         text,
  recibe_nombre       text,
  recibe_rut          text,

  -- Flujo
  estado              text default 'borrador'
    check (estado in ('borrador','enviada','lote_creado')),
  lote_id             uuid,           -- lote creado a partir de esta acta

  created_at          timestamptz default now()
);

-- RLS
alter table actas_recepcion_vehiculos enable row level security;

do $$ begin
  create policy "actas_recepcion_casa"
    on actas_recepcion_vehiculos for all
    using (
      casa_id = (select casa_id from usuarios where id = auth.uid())
      or
      (select role from usuarios where id = auth.uid()) = 'admin'
    );
exception when duplicate_object then null;
end $$;

-- Índices
create index if not exists arv_casa_id    on actas_recepcion_vehiculos(casa_id);
create index if not exists arv_estado     on actas_recepcion_vehiculos(estado);
create index if not exists arv_ppu        on actas_recepcion_vehiculos(ppu);
create index if not exists arv_created_at on actas_recepcion_vehiculos(created_at desc);
