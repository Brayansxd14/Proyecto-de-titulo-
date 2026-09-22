import pool from '../db.js'
import { readSpreadsheet, valueFrom } from '../utils/spreadsheet.js'

export const obtenerProveedores = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, rut, contacto, telefono, email, direccion, estado, created_at
       FROM proveedores
       ORDER BY nombre ASC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error al obtener proveedores:', err.message)
    res.status(500).send('Error al obtener proveedores')
  }
}

export const crearProveedor = async (req, res) => {
  try {
    const { nombre, rut, contacto, telefono, email, direccion, estado = 'Activo' } = req.body
    if (!nombre?.trim()) {
      return res.status(400).send('El nombre del proveedor es obligatorio')
    }

    const result = await pool.query(
      `INSERT INTO proveedores (nombre, rut, contacto, telefono, email, direccion, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nombre.trim(), rut?.trim() || null, contacto?.trim() || null, telefono?.trim() || null, email?.trim() || null, direccion?.trim() || null, estado]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).send('Ya existe un proveedor con ese nombre')
    }
    console.error('Error al crear proveedor:', err.message)
    res.status(500).send('Error al crear proveedor')
  }
}

export const actualizarProveedor = async (req, res) => {
  try {
    const { nombre, rut, contacto, telefono, email, direccion, estado } = req.body
    if (!nombre?.trim()) {
      return res.status(400).send('El nombre del proveedor es obligatorio')
    }

    const result = await pool.query(
      `UPDATE proveedores
       SET nombre = $1, rut = $2, contacto = $3, telefono = $4, email = $5, direccion = $6, estado = $7
       WHERE id = $8
       RETURNING *`,
      [nombre.trim(), rut?.trim() || null, contacto?.trim() || null, telefono?.trim() || null, email?.trim() || null, direccion?.trim() || null, estado, req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).send('Proveedor no encontrado')
    }
    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).send('Ya existe un proveedor con ese nombre')
    }
    console.error('Error al actualizar proveedor:', err.message)
    res.status(500).send('Error al actualizar proveedor')
  }
}

export const eliminarProveedor = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM proveedores WHERE id = $1 RETURNING *', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).send('Proveedor no encontrado')
    }
    res.json({ mensaje: 'Proveedor eliminado correctamente', proveedor: result.rows[0] })
  } catch (err) {
    console.error('Error al eliminar proveedor:', err.message)
    res.status(500).send('Error al eliminar proveedor')
  }
}

export const importarProveedores = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Selecciona un archivo Excel o CSV' })
  const client = await pool.connect()
  const errors = []
  let imported = 0
  try {
    const rows = readSpreadsheet(req.file.buffer)
    if (!rows.length) return res.status(400).json({ message: 'El archivo no contiene filas de datos' })
    await client.query('BEGIN')
    for (const [index, row] of rows.entries()) {
      const nombre = String(valueFrom(row, ['nombre', 'proveedor', 'razonsocial']) || '').trim()
      if (!nombre) { errors.push({ fila: index + 2, motivo: 'Falta el nombre del proveedor' }); continue }
      await client.query(`INSERT INTO proveedores (nombre, rut, contacto, telefono, email, direccion, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (nombre) DO UPDATE SET rut = EXCLUDED.rut, contacto = EXCLUDED.contacto, telefono = EXCLUDED.telefono, email = EXCLUDED.email, direccion = EXCLUDED.direccion, estado = EXCLUDED.estado`,
      [nombre, valueFrom(row, ['rut']), valueFrom(row, ['contacto']), valueFrom(row, ['telefono', 'celular']), valueFrom(row, ['email', 'correo']), valueFrom(row, ['direccion']), valueFrom(row, ['estado']) || 'Activo'])
      imported += 1
    }
    await client.query('COMMIT')
    res.json({ imported, rejected: errors.length, errors })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error al importar proveedores:', error.message)
    res.status(500).json({ message: 'No se pudo importar el archivo' })
  } finally { client.release() }
}
