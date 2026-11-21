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

ALTER TABLE inventario
  ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE inventario
  ALTER COLUMN proveedor TYPE VARCHAR(150);

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

ALTER TABLE taller_ingresos ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE taller_ingresos ADD COLUMN IF NOT EXISTS stock_descontado BOOLEAN NOT NULL DEFAULT FALSE;

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

CREATE TABLE IF NOT EXISTS taller_stock_consumos (
  id SERIAL PRIMARY KEY,
  ingreso_id INTEGER NOT NULL REFERENCES taller_ingresos(id) ON DELETE RESTRICT,
  codigo VARCHAR(80) NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  consumido_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  devuelto_en TIMESTAMPTZ
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

CREATE TABLE IF NOT EXISTS taller_presupuesto_items (
  id SERIAL PRIMARY KEY,
  presupuesto_id INTEGER NOT NULL REFERENCES taller_presupuestos(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('labor', 'part')),
  nombre VARCHAR(180) NOT NULL,
  codigo VARCHAR(40),
  precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
  cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
  duracion VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO taller_presupuesto_items (presupuesto_id, tipo, nombre, codigo, precio, cantidad, duracion)
SELECT p.id, i.tipo, i.nombre, i.codigo, i.precio, i.cantidad, i.duracion
FROM taller_presupuestos p
JOIN taller_ingreso_items i ON i.ingreso_id = p.ingreso_id
WHERE NOT EXISTS (
  SELECT 1 FROM taller_presupuesto_items pi WHERE pi.presupuesto_id = p.id
);

CREATE TABLE IF NOT EXISTS taller_facturas (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(40) NOT NULL UNIQUE,
  ingreso_id INTEGER NOT NULL REFERENCES taller_ingresos(id) ON DELETE RESTRICT,
  estado VARCHAR(40) NOT NULL DEFAULT 'Pendiente de pago',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  descuento NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
  iva_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (iva_porcentaje >= 0 AND iva_porcentaje <= 100),
  iva NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (iva >= 0),
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.taller_facturas'::regclass
      AND conname = 'taller_facturas_ingreso_id_fkey'
      AND confdeltype = 'c'
  ) THEN
    ALTER TABLE taller_facturas DROP CONSTRAINT taller_facturas_ingreso_id_fkey;
    ALTER TABLE taller_facturas
      ADD CONSTRAINT taller_facturas_ingreso_id_fkey
      FOREIGN KEY (ingreso_id) REFERENCES taller_ingresos(id) ON DELETE RESTRICT;
  END IF;
END $$;

ALTER TABLE taller_facturas ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE taller_facturas ADD COLUMN IF NOT EXISTS descuento NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE taller_facturas ADD COLUMN IF NOT EXISTS iva_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 0;
ALTER TABLE taller_facturas ADD COLUMN IF NOT EXISTS iva NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE taller_facturas ADD COLUMN IF NOT EXISTS anulada_en TIMESTAMPTZ;
UPDATE taller_facturas SET subtotal = total WHERE subtotal = 0 AND total > 0;

CREATE TABLE IF NOT EXISTS taller_factura_items (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL REFERENCES taller_facturas(id),
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('labor', 'part')),
  nombre VARCHAR(180) NOT NULL,
  codigo VARCHAR(40),
  precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
  cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO taller_factura_items (factura_id, tipo, nombre, codigo, precio, cantidad)
SELECT f.id, ii.tipo, ii.nombre, ii.codigo, ii.precio, ii.cantidad
FROM taller_facturas f
JOIN taller_ingreso_items ii ON ii.ingreso_id = f.ingreso_id
WHERE NOT EXISTS (
  SELECT 1 FROM taller_factura_items fi WHERE fi.factura_id = f.id
);

CREATE TABLE IF NOT EXISTS taller_factura_pagos (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL REFERENCES taller_facturas(id),
  monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  metodo VARCHAR(40) NOT NULL DEFAULT 'Otro',
  observacion TEXT,
  pagado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO taller_factura_pagos (factura_id, monto, metodo, observacion, pagado_en)
SELECT f.id, f.total, 'Otro', 'Pago migrado desde estado pagado anterior', f.created_at
FROM taller_facturas f
WHERE f.estado = 'Pagada' AND f.total > 0
  AND NOT EXISTS (
    SELECT 1 FROM taller_factura_pagos p WHERE p.factura_id = f.id
  );

UPDATE taller_facturas
SET anulada_en = created_at
WHERE estado = 'Anulada' AND anulada_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_taller_factura_items_factura ON taller_factura_items(factura_id);
CREATE INDEX IF NOT EXISTS idx_taller_factura_pagos_factura ON taller_factura_pagos(factura_id);

CREATE TABLE IF NOT EXISTS facturas_proveedores (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
  numero_documento VARCHAR(80) NOT NULL,
  fecha_emision DATE NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  descuento NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
  iva_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (iva_porcentaje >= 0 AND iva_porcentaje <= 100),
  iva NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (iva >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proveedor_id, numero_documento)
);

CREATE TABLE IF NOT EXISTS facturas_proveedores_items (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL REFERENCES facturas_proveedores(id),
  numero_serie VARCHAR(80) NOT NULL,
  nombre VARCHAR(180) NOT NULL,
  tipo VARCHAR(80) NOT NULL DEFAULT 'otro',
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  costo_unitario NUMERIC(12, 2) NOT NULL CHECK (costo_unitario >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_fecha ON facturas_proveedores(fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_items_factura ON facturas_proveedores_items(factura_id);

CREATE INDEX IF NOT EXISTS idx_taller_ingresos_fecha ON taller_ingresos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_taller_vehiculos_cliente ON taller_vehiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_taller_items_ingreso ON taller_ingreso_items(ingreso_id);
CREATE INDEX IF NOT EXISTS idx_taller_stock_consumos_ingreso ON taller_stock_consumos(ingreso_id);
CREATE INDEX IF NOT EXISTS idx_taller_stock_consumos_pendientes ON taller_stock_consumos(codigo) WHERE devuelto_en IS NULL;
CREATE INDEX IF NOT EXISTS idx_taller_presupuesto_items_presupuesto ON taller_presupuesto_items(presupuesto_id);

ALTER TABLE usuarios DROP COLUMN IF EXISTS empleado_rut;
