-- Causas v2: campos que faltan para replicar el cronograma REMATES AHUMADA.xlsx
-- Ejecutar en Supabase SQL Editor (es seguro correr aunque ya existan columnas)

-- Columna I: Mínimo (puede ser monto, "M/P" (mejor postor) o "pendiente")
alter table causas add column if not exists minimo text;

-- Columna J: Designación Martillero (OK)
alter table causas add column if not exists designacion_martillero boolean default false;

-- Columna K: Aviso de Entrega al deudor (OK)
alter table causas add column if not exists aviso_entrega boolean default false;

-- Columna L: Acta de Recepción (OK) — distinto al archivo subido (acta_url)
alter table causas add column if not exists acta_recepcion_ok boolean default false;

-- Columna M: Bases y Propuestas — fecha propuesta, hora, notas (col con colores en el xlsx)
alter table causas add column if not exists bases_fecha date;
alter table causas add column if not exists bases_hora text;
alter table causas add column if not exists bases_notas text;

-- Columna N: Aviso en el Diario (OK)
alter table causas add column if not exists aviso_diario boolean default false;

-- Columna O: Aviso en Boletín Concursal (OK)
alter table causas add column if not exists aviso_boletin_concursal boolean default false;

-- Columna P: Fecha de Remate (la fecha real del remate, separada del remate_id del sistema)
alter table causas add column if not exists fecha_remate date;

-- Migración de nombres de estado (si ya hay datos con estado viejo)
update causas set estado = 'bases_enviadas'    where estado = 'fecha_solicitada';
update causas set estado = 'fecha_aprobada'    where estado = 'fecha_aprobada'; -- sin cambio
