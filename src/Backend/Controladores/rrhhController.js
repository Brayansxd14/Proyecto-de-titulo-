import pool from '../db.js'

const consultas = {
  vacaciones: `
    SELECT v.*, e.cargo
    FROM vacaciones v
    JOIN empleados e ON e.rut = v.empleado_rut
    ORDER BY v.fecha_inicio DESC, v.id DESC`,
  permisos: `
    SELECT p.*, e.cargo
    FROM permisos p
    JOIN empleados e ON e.rut = p.empleado_rut
    ORDER BY p.fecha_inicio DESC, p.id DESC`,
  bonos: `
    SELECT b.*, e.cargo
    FROM bonos b
    JOIN empleados e ON e.rut = b.empleado_rut
    ORDER BY b.periodo DESC, b.id DESC`,
  salarios: `
    SELECT s.*, e.cargo
    FROM salarios s
    JOIN empleados e ON e.rut = s.empleado_rut
    ORDER BY s.fecha_vigencia DESC, s.id DESC`,
  liquidaciones: `
    SELECT l.*, e.cargo
    FROM liquidaciones_sueldo l
    JOIN empleados e ON e.rut = l.empleado_rut
    ORDER BY l.periodo DESC, l.id DESC`
}

export const obtenerModuloRrhh = async (req, res) => {
  const { modulo } = req.params
  const consulta = consultas[modulo]

  if (!consulta) return res.status(404).json({ error: 'Módulo de RRHH no encontrado' })

  try {
    const result = await pool.query(consulta)
    res.json(result.rows)
  } catch (err) {
    console.error(`Error al obtener ${modulo}:`, err.message)
    res.status(500).json({ error: `Error al obtener ${modulo}` })
  }
}

export const crearVacacion = async (req, res) => {
  const { empleado_rut, fecha_inicio, fecha_fin, dias, observacion, estado } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO vacaciones (empleado_rut, fecha_inicio, fecha_fin, dias, observacion, estado)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Pendiente')) RETURNING *`,
      [empleado_rut, fecha_inicio, fecha_fin, dias, observacion || null, estado || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const crearPermiso = async (req, res) => {
  const { empleado_rut, tipo, fecha_inicio, fecha_fin, motivo, estado } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO permisos (empleado_rut, tipo, fecha_inicio, fecha_fin, motivo, estado)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Pendiente')) RETURNING *`,
      [empleado_rut, tipo, fecha_inicio, fecha_fin, motivo || null, estado || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const crearBono = async (req, res) => {
  const { empleado_rut, tipo, monto, periodo, descripcion, estado } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO bonos (empleado_rut, tipo, monto, periodo, descripcion, estado)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Asignado')) RETURNING *`,
      [empleado_rut, tipo, monto, periodo, descripcion || null, estado || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const crearBonosParaTodos = async (req, res) => {
  const { tipo, monto, periodo, descripcion, estado } = req.body
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const empleados = await client.query('SELECT rut FROM empleados ORDER BY rut')

    if (empleados.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'No hay empleados para asignar el bono' })
    }

    for (const empleado of empleados.rows) {
      await client.query(
        `INSERT INTO bonos (empleado_rut, tipo, monto, periodo, descripcion, estado)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Asignado'))`,
        [empleado.rut, tipo, monto, periodo, descripcion || null, estado || null]
      )
    }

    await client.query('COMMIT')
    res.status(201).json({ cantidad: empleados.rows.length, mensaje: 'Bono asignado a todos los empleados' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
  }
}

export const crearSalario = async (req, res) => {
  const { empleado_rut, monto, fecha_vigencia, tipo, observacion } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO salarios (empleado_rut, monto, fecha_vigencia, tipo, observacion)
       VALUES ($1, $2, $3, COALESCE($4, 'Base'), $5) RETURNING *`,
      [empleado_rut, monto, fecha_vigencia, tipo || null, observacion || null]
    )
    await pool.query('UPDATE empleados SET salario = $1 WHERE rut = $2', [monto, empleado_rut])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const crearLiquidacion = async (req, res) => {
  const {
    empleado_rut,
    periodo,
    sueldo_base = 0,
    bonos_total = 0,
    descuentos = 0,
    total_liquido,
    estado,
    fecha_generacion
  } = req.body
  const totalCalculado = total_liquido ?? Number(sueldo_base) + Number(bonos_total) - Number(descuentos)

  try {
    const result = await pool.query(
      `INSERT INTO liquidaciones_sueldo
       (empleado_rut, periodo, sueldo_base, bonos_total, descuentos, total_liquido, estado, fecha_generacion)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'Borrador'), $8)
       RETURNING *`,
      [empleado_rut, periodo, sueldo_base, bonos_total, descuentos, totalCalculado, estado || null, fecha_generacion || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
