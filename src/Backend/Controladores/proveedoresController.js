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
    if (err.code === '23503') {
      return res.status(409).send('No se puede eliminar un proveedor con facturas de compra registradas')
    }
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

export const obtenerFacturasProveedor = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.id, f.numero_documento AS "documentNumber",
             f.fecha_emision AS "issueDate", f.subtotal, f.descuento AS discount,
             f.iva_porcentaje AS "taxRate", f.iva AS tax, f.total,
             f.created_at AS received, p.id AS "providerId", p.nombre AS "providerName",
             COUNT(fi.id)::int AS "itemCount",
             COALESCE(
               json_agg(json_build_object(
                 'code', fi.numero_serie, 'name', fi.nombre, 'type', fi.tipo,
                 'quantity', fi.cantidad, 'price', fi.costo_unitario
               )) FILTER (WHERE fi.id IS NOT NULL),
               '[]'::json
             ) AS items
      FROM facturas_proveedores f
      JOIN proveedores p ON p.id = f.proveedor_id
      LEFT JOIN facturas_proveedores_items fi ON fi.factura_id = f.id
      GROUP BY f.id, p.id, p.nombre
      ORDER BY f.fecha_emision DESC, f.id DESC`)
    res.json(result.rows.map(row => ({
      ...row,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      taxRate: Number(row.taxRate),
      tax: Number(row.tax),
      total: Number(row.total)
    })))
  } catch (error) {
    console.error('Error al obtener facturas de proveedores:', error.message)
    res.status(500).json({ error: 'No se pudieron cargar las facturas de proveedores' })
  }
}

export const registrarFacturaProveedor = async (req, res) => {
  const client = await pool.connect()
  let transactionStarted = false
  try {
    const body = req.body || {}
    const providerId = Number(body.providerId)
    const documentNumber = String(body.documentNumber || '').trim()
    const issueDate = String(body.issueDate || '').trim()
    let discount = Number(body.discount || 0)
    let taxRate = Number(body.taxRate || 0)
    const items = body.items

    const parsedIssueDate = /^\d{4}-\d{2}-\d{2}$/.test(issueDate)
      ? new Date(`${issueDate}T00:00:00.000Z`)
      : null
    if (
      !Number.isInteger(providerId) ||
      !documentNumber ||
      documentNumber.length > 80 ||
      !parsedIssueDate ||
      Number.isNaN(parsedIssueDate.getTime()) ||
      parsedIssueDate.toISOString().slice(0, 10) !== issueDate ||
      !Array.isArray(items) ||
      !items.length
    ) {
      return res.status(400).json({ error: 'Proveedor, número, fecha y al menos un repuesto son obligatorios' })
    }
    if (items.length > 200) return res.status(400).json({ error: 'Una factura puede incluir como máximo 200 repuestos' })
    if (items.some(item => !item || typeof item !== 'object' || Array.isArray(item))) {
      return res.status(400).json({ error: 'El detalle de repuestos no es válido' })
    }
    if (!Number.isFinite(discount) || discount < 0 || !Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      return res.status(400).json({ error: 'Descuento o IVA no válido' })
    }
    discount = Number(discount.toFixed(2))

    const normalizedItems = items.map(item => ({
      code: String(item.code || '').trim(),
      name: String(item.name || '').trim(),
      type: String(item.type || 'otro').trim() || 'otro',
      quantity: Number(item.quantity),
      price: Number(Number(item.price).toFixed(2))
    }))
    if (normalizedItems.some(item =>
      !item.code || item.code.length > 50 || !item.name || item.name.length > 100 || item.type.length > 50 ||
      !Number.isInteger(item.quantity) || item.quantity <= 0 ||
      !Number.isFinite(item.price) || item.price < 0
    )) {
      return res.status(400).json({ error: 'Cada repuesto requiere código (máx. 50), nombre (máx. 100), tipo (máx. 50), cantidad entera y costo válido' })
    }
    if (new Set(normalizedItems.map(item => item.code)).size !== normalizedItems.length) {
      return res.status(400).json({ error: 'No repitas el código de un repuesto dentro de la factura' })
    }

    const subtotal = Number(normalizedItems.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2))
    if (discount > subtotal) return res.status(400).json({ error: 'El descuento no puede superar el subtotal' })
    taxRate = Number(taxRate.toFixed(2))
    if (taxRate > 100) return res.status(400).json({ error: 'El IVA debe estar entre 0% y 100%' })
    const tax = Number(((subtotal - discount) * taxRate / 100).toFixed(2))
    const total = Number((subtotal - discount + tax).toFixed(2))

    await client.query('BEGIN')
    transactionStarted = true
    const provider = await client.query(
      `SELECT id, nombre FROM proveedores WHERE id = $1 AND estado = 'Activo' FOR SHARE`,
      [providerId]
    )
    if (!provider.rows[0]) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(404).json({ error: 'Proveedor no encontrado o inactivo' })
    }

    const invoice = await client.query(
      `INSERT INTO facturas_proveedores
        (proveedor_id, numero_documento, fecha_emision, subtotal, descuento, iva_porcentaje, iva, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, numero_documento AS "documentNumber", fecha_emision AS "issueDate",
                 subtotal, descuento AS discount, iva_porcentaje AS "taxRate", iva AS tax, total`,
      [providerId, documentNumber, issueDate, subtotal, discount, taxRate, tax, total]
    )

    for (const item of normalizedItems) {
      await client.query(
        `INSERT INTO facturas_proveedores_items
          (factura_id, numero_serie, nombre, tipo, cantidad, costo_unitario)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invoice.rows[0].id, item.code, item.name, item.type, item.quantity, item.price]
      )
      await client.query(
        `INSERT INTO inventario (numero_serie, nombre, cantidad, precio, costo_unitario, tipo, proveedor, estado)
         VALUES ($1, $2, $3, 0, $4, $5, $6, 'con stock')
         ON CONFLICT (numero_serie) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           cantidad = inventario.cantidad + EXCLUDED.cantidad,
           costo_unitario = EXCLUDED.costo_unitario,
           tipo = EXCLUDED.tipo,
           proveedor = EXCLUDED.proveedor,
           estado = 'con stock'`,
        [item.code, item.name, item.quantity, item.price, item.type, provider.rows[0].nombre]
      )
    }

    await client.query('COMMIT')
    transactionStarted = false
    res.status(201).json({
      ...invoice.rows[0],
      providerName: provider.rows[0].nombre,
      itemCount: normalizedItems.length,
      subtotal,
      discount,
      taxRate,
      tax,
      total
    })
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK')
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese proveedor ya tiene una factura con ese número' })
    }
    console.error('Error al registrar factura de proveedor:', error.message)
    res.status(500).json({ error: 'No se pudo registrar la factura ni recibir los repuestos' })
  } finally {
    client.release()
  }
}
