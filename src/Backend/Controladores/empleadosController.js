/* eslint-disable no-unused-vars */
import pool from '../db.js'
import XLSX from 'xlsx'
import { numberFrom, readSpreadsheet, valueFrom } from '../utils/spreadsheet.js'

// Crear empleado
export const crearEmpleado = async (req, res) => {
  const { rut, cargo, telefono, fecha_ingreso, salario } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO empleados (rut, cargo, telefono, fecha_ingreso, salario) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [rut, cargo, telefono, fecha_ingreso, salario || null]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).send('Error al crear empleado')
  }
}

export const importarEmpleados = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Selecciona un archivo Excel o CSV' })

  let rows
  try {
    rows = readSpreadsheet(req.file.buffer)
  } catch {
    return res.status(400).json({ message: 'No se pudo leer el archivo. Verifica que sea un Excel o CSV válido.' })
  }

  if (!rows.length) return res.status(400).json({ message: 'El archivo no contiene filas de datos' })

  const errors = []
  let imported = 0
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const [index, row] of rows.entries()) {
      const rut = String(valueFrom(row, ['rut']) ?? '').trim()
      const cargo = String(valueFrom(row, ['cargo']) ?? '').trim()
      const telefono = String(valueFrom(row, ['telefono', 'celular']) ?? '').trim() || null
      const rawFechaIngreso = valueFrom(row, ['fechaingreso', 'fecha'])
      const rawSalario = valueFrom(row, ['salario', 'sueldo'])
      let fechaIngreso = null
      if (rawFechaIngreso instanceof Date && !Number.isNaN(rawFechaIngreso.getTime())) {
        fechaIngreso = rawFechaIngreso.toISOString().slice(0, 10)
      } else if (rawFechaIngreso) {
        fechaIngreso = String(rawFechaIngreso).trim()
      }
      const salario = String(rawSalario ?? '').trim() ? numberFrom(rawSalario) : null

      if (!rut || !cargo) {
        errors.push({ fila: index + 2, motivo: 'RUT y cargo son obligatorios' })
        continue
      }
      const fechaParseada = fechaIngreso ? new Date(`${fechaIngreso}T00:00:00Z`) : null
      if (fechaIngreso && (
        !/^\d{4}-\d{2}-\d{2}$/.test(fechaIngreso) ||
        Number.isNaN(fechaParseada.getTime()) ||
        fechaParseada.toISOString().slice(0, 10) !== fechaIngreso
      )) {
        errors.push({ fila: index + 2, motivo: 'La fecha de ingreso debe tener formato AAAA-MM-DD' })
        continue
      }
      if (salario !== null && (!Number.isFinite(salario) || salario < 0)) {
        errors.push({ fila: index + 2, motivo: 'El salario debe ser un número igual o mayor que cero' })
        continue
      }

      await client.query(
        `INSERT INTO empleados (rut, cargo, telefono, fecha_ingreso, salario)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (rut) DO UPDATE
         SET cargo = EXCLUDED.cargo,
             telefono = COALESCE(EXCLUDED.telefono, empleados.telefono),
             fecha_ingreso = COALESCE(EXCLUDED.fecha_ingreso, empleados.fecha_ingreso),
             salario = COALESCE(EXCLUDED.salario, empleados.salario)`,
        [rut, cargo, telefono, fechaIngreso, salario]
      )
      imported += 1
    }

    await client.query('COMMIT')
    res.json({ imported, rejected: errors.length, errors })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error al importar empleados:', error.message)
    res.status(500).json({ message: 'No se pudo importar el archivo de empleados' })
  } finally {
    client.release()
  }
}

export const exportarEmpleados = async (req, res) => {
  const { busqueda = '' } = req.query
  try {
    const result = await pool.query(
      `SELECT e.rut, u.nombre, u.email, e.cargo, e.telefono, e.fecha_ingreso, e.salario
       FROM empleados e
       LEFT JOIN usuarios u ON u.rut = e.rut
       WHERE e.rut ILIKE $1 OR e.cargo ILIKE $1
       ORDER BY e.rut`,
      [`%${busqueda}%`]
    )
    const rows = result.rows.map((empleado) => ({
      RUT: empleado.rut,
      Nombre: empleado.nombre || '',
      Correo: empleado.email || '',
      Cargo: empleado.cargo || '',
      Teléfono: empleado.telefono || '',
      'Fecha de ingreso': empleado.fecha_ingreso || '',
      Salario: empleado.salario ?? ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['RUT', 'Nombre', 'Correo', 'Cargo', 'Teléfono', 'Fecha de ingreso', 'Salario']
    })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Empleados')
    const file = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="empleados.xlsx"')
    res.send(file)
  } catch (error) {
    console.error('Error al exportar empleados:', error.message)
    res.status(500).json({ message: 'No se pudo exportar la lista de empleados' })
  }
}

// Obtener todos los empleados
export const obtenerEmpleados = async (req, res) => {
  const { busqueda = '' } = req.query
  try {
    const result = await pool.query(
      `SELECT e.*, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM empleados e
       LEFT JOIN usuarios u ON u.rut = e.rut
       WHERE e.rut ILIKE $1 OR e.cargo ILIKE $1
       ORDER BY e.rut`,
      [`%${busqueda}%`]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).send('Error al obtener empleados')
  }
}

// Actualizar datos de un empleado
export const actualizarEmpleado = async (req, res) => {
  const { rut } = req.params
  const { cargo, telefono, fecha_ingreso, salario } = req.body
  try {
    const result = await pool.query(
      `UPDATE empleados
       SET cargo = $1, telefono = $2, fecha_ingreso = $3, salario = $4
       WHERE rut = $5
       RETURNING *`,
      [cargo, telefono, fecha_ingreso, salario || null, rut]
    )

    if (result.rows.length === 0) return res.status(404).send('Empleado no encontrado')
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).send('Error al actualizar empleado')
  }
}

// Obtener empleado por RUT
export const obtenerEmpleadoPorRut = async (req, res) => {
  const { rut } = req.params
  try {
    const result = await pool.query(
      `SELECT e.*, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM empleados e
       LEFT JOIN usuarios u ON u.rut = e.rut
       WHERE e.rut = $1`,
      [rut]
    )
    if (result.rows.length === 0) return res.status(404).send('Empleado no encontrado')
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).send('Error al obtener empleado')
  }
}

// Eliminar empleado
export const eliminarEmpleado = async (req, res) => {
  const { rut } = req.params
  try {
    await pool.query('DELETE FROM empleados WHERE rut=$1', [rut])
    res.send('Empleado eliminado')
  } catch (err) {
    res.status(500).send('Error al eliminar empleado')
  }
}
