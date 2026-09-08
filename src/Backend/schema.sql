CREATE TABLE IF NOT EXISTS vacaciones (
  id SERIAL PRIMARY KEY,
  empleado_rut VARCHAR NOT NULL REFERENCES empleados(rut) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias NUMERIC(5, 2) NOT NULL CHECK (dias > 0),
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada', 'Tomada')),
  observacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE IF NOT EXISTS permisos (
  id SERIAL PRIMARY KEY,
  empleado_rut VARCHAR NOT NULL REFERENCES empleados(rut) ON DELETE CASCADE,
  tipo VARCHAR(80) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  motivo TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE IF NOT EXISTS bonos (
  id SERIAL PRIMARY KEY,
  empleado_rut VARCHAR NOT NULL REFERENCES empleados(rut) ON DELETE CASCADE,
  tipo VARCHAR(80) NOT NULL,
  monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
  periodo DATE NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Asignado', 'Pagado', 'Anulado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salarios (
  id SERIAL PRIMARY KEY,
  empleado_rut VARCHAR NOT NULL REFERENCES empleados(rut) ON DELETE CASCADE,
  monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
  fecha_vigencia DATE NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'Base' CHECK (tipo IN ('Base', 'Hora', 'Otro')),
  observacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empleado_rut, fecha_vigencia, tipo)
);

CREATE TABLE IF NOT EXISTS liquidaciones_sueldo (
  id SERIAL PRIMARY KEY,
  empleado_rut VARCHAR NOT NULL REFERENCES empleados(rut) ON DELETE CASCADE,
  periodo DATE NOT NULL,
  sueldo_base NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (sueldo_base >= 0),
  bonos_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (bonos_total >= 0),
  descuentos NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (descuentos >= 0),
  total_liquido NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_liquido >= 0),
  estado VARCHAR(20) NOT NULL DEFAULT 'Borrador' CHECK (estado IN ('Borrador', 'Generada', 'Pagada', 'Anulada')),
  fecha_generacion DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empleado_rut, periodo)
);

CREATE INDEX IF NOT EXISTS idx_vacaciones_empleado ON vacaciones(empleado_rut);
CREATE INDEX IF NOT EXISTS idx_permisos_empleado ON permisos(empleado_rut);
CREATE INDEX IF NOT EXISTS idx_bonos_empleado_periodo ON bonos(empleado_rut, periodo);
CREATE INDEX IF NOT EXISTS idx_salarios_empleado_vigencia ON salarios(empleado_rut, fecha_vigencia DESC);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_empleado_periodo ON liquidaciones_sueldo(empleado_rut, periodo DESC);
