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

CREATE TABLE IF NOT EXISTS proveedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  rut VARCHAR(20),
  contacto VARCHAR(120),
  telefono VARCHAR(40),
  email VARCHAR(160),
  direccion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);

CREATE TABLE IF NOT EXISTS taller_clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(180) NOT NULL,
  rut VARCHAR(20) NOT NULL UNIQUE,
  telefono VARCHAR(40),
  email VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taller_vehiculos (
  id SERIAL PRIMARY KEY,
  patente VARCHAR(12) NOT NULL UNIQUE,
  marca VARCHAR(80) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  anio VARCHAR(4),
  cliente_id INTEGER NOT NULL REFERENCES taller_clientes(id) ON DELETE CASCADE,
  kilometraje VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taller_mano_obra (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30),
  nombre VARCHAR(180) NOT NULL,
  unidad VARCHAR(30) NOT NULL DEFAULT 'Servicio',
  precio NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  duracion VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taller_ingresos (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(40) NOT NULL UNIQUE,
  vehiculo_id INTEGER NOT NULL REFERENCES taller_vehiculos(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  descripcion TEXT NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taller_ingreso_items (
  id SERIAL PRIMARY KEY,
  ingreso_id INTEGER NOT NULL REFERENCES taller_ingresos(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('labor', 'part')),
  nombre VARCHAR(180) NOT NULL,
  codigo VARCHAR(40),
  precio NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  duracion VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS taller_fotos (
  id SERIAL PRIMARY KEY,
  ingreso_id INTEGER NOT NULL REFERENCES taller_ingresos(id) ON DELETE CASCADE,
  nombre_original VARCHAR(255) NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taller_presupuestos (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(40) NOT NULL UNIQUE,
  ingreso_id INTEGER NOT NULL REFERENCES taller_ingresos(id) ON DELETE CASCADE,
  estado VARCHAR(30) NOT NULL DEFAULT 'Borrador',
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taller_facturas (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(40) NOT NULL UNIQUE,
  ingreso_id INTEGER NOT NULL REFERENCES taller_ingresos(id) ON DELETE CASCADE,
  estado VARCHAR(40) NOT NULL DEFAULT 'Pendiente de pago',
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taller_ingresos_fecha ON taller_ingresos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_taller_vehiculos_cliente ON taller_vehiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_taller_items_ingreso ON taller_ingreso_items(ingreso_id);
