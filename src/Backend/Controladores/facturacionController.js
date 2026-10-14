import pool from '../db.js'

export const obtenerFacturacion = async (_req, res) => {
  try {
    const [invoices, orders] = await Promise.all([
      pool.query(`
        SELECT f.id, f.numero AS number, f.ingreso_id AS "entryId",
               f.estado AS status, f.total, f.created_at AS created,
               i.numero AS "entryNumber", i.fecha AS "entryDate",
               v.patente AS plate, v.marca AS brand, v.modelo AS model,
               c.nombre AS "clientName", c.rut AS "clientRut",
               c.telefono AS "clientPhone", c.email AS "clientEmail"
        FROM taller_facturas f
        JOIN taller_ingresos i ON i.id = f.ingreso_id
        JOIN taller_vehiculos v ON v.id = i.vehiculo_id
        JOIN taller_clientes c ON c.id = v.cliente_id
        ORDER BY f.created_at DESC, f.id DESC`),
      pool.query(`
        SELECT i.id AS "entryId", i.numero AS "entryNumber",
               i.fecha AS "entryDate", v.patente AS plate,
               v.marca AS brand, v.modelo AS model,
               c.nombre AS "clientName", c.rut AS "clientRut",
               COUNT(ii.id)::int AS "itemCount",
               COALESCE(SUM(ii.precio * ii.cantidad), 0) AS total
        FROM taller_ingresos i
        JOIN taller_vehiculos v ON v.id = i.vehiculo_id
        JOIN taller_clientes c ON c.id = v.cliente_id
        LEFT JOIN taller_facturas f ON f.ingreso_id = i.id
        LEFT JOIN taller_ingreso_items ii ON ii.ingreso_id = i.id
        WHERE f.id IS NULL
        GROUP BY i.id, i.numero, i.fecha, v.patente, v.marca, v.modelo,
                 c.nombre, c.rut
        HAVING COUNT(ii.id) > 0
        ORDER BY i.fecha DESC, i.id DESC`)
    ])

    res.json({
      invoices: invoices.rows.map(row => ({ ...row, total: Number(row.total) })),
      orders: orders.rows.map(row => ({ ...row, total: Number(row.total) }))
    })
  } catch (error) {
    console.error('Error al obtener facturación:', error.message)
    res.status(500).json({ error: 'No se pudo cargar la facturación desde la base de datos' })
  }
}

export const crearFactura = async (req, res) => {
  const client = await pool.connect()
  let transactionStarted = false

  try {
    await client.query('BEGIN')
    transactionStarted = true

    const entry = await client.query(
      'SELECT id FROM taller_ingresos WHERE id = $1 FOR UPDATE',
      [req.params.id]
    )
    if (!entry.rows[0]) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    const existingInvoice = await client.query(
      'SELECT id FROM taller_facturas WHERE ingreso_id = $1',
      [req.params.id]
    )
    if (existingInvoice.rows[0]) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(409).json({ error: 'Esta orden de trabajo ya tiene una factura' })
    }

    const totalResult = await client.query(
      'SELECT COALESCE(SUM(precio * cantidad), 0) AS total FROM taller_ingreso_items WHERE ingreso_id = $1',
      [req.params.id]
    )
    const total = Number(totalResult.rows[0].total)
    if (total <= 0) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(400).json({ error: 'Agrega trabajos o repuestos antes de facturar' })
    }

    const number = `FAC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const result = await client.query(
      `INSERT INTO taller_facturas (numero, ingreso_id, total)
       VALUES ($1, $2, $3)
       RETURNING id, numero AS number, ingreso_id AS "entryId",
                 estado AS status, total, created_at AS created`,
      [number, req.params.id, total]
    )

    await client.query('COMMIT')
    transactionStarted = false
    res.status(201).json({ ...result.rows[0], total: Number(result.rows[0].total) })
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK')
    console.error('Error al crear factura:', error.message)
    res.status(error.code === '23505' ? 409 : 500).json({
      error: error.code === '23505' ? 'No se pudo asignar un número único a la factura' : 'No se pudo crear la factura'
    })
  } finally {
    client.release()
  }
}