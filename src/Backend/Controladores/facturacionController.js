import pool from '../db.js'

const invoiceSelect = `
  SELECT f.id, f.numero AS number, f.ingreso_id AS "entryId",
         f.estado AS status, f.subtotal, f.descuento AS discount,
         f.iva_porcentaje AS "taxRate", f.iva AS tax, f.total,
         f.created_at AS created, f.anulada_en AS "cancelledAt",
         i.numero AS "entryNumber", i.fecha AS "entryDate",
         v.patente AS plate, v.marca AS brand, v.modelo AS model,
         c.nombre AS "clientName", c.rut AS "clientRut",
         c.telefono AS "clientPhone", c.email AS "clientEmail",
         COALESCE(p.paid, 0) AS "amountPaid",
         GREATEST(f.total - COALESCE(p.paid, 0), 0) AS balance
  FROM taller_facturas f
  JOIN taller_ingresos i ON i.id = f.ingreso_id
  JOIN taller_vehiculos v ON v.id = i.vehiculo_id
  JOIN taller_clientes c ON c.id = v.cliente_id
  LEFT JOIN (
    SELECT factura_id, SUM(monto) AS paid
    FROM taller_factura_pagos
    GROUP BY factura_id
  ) p ON p.factura_id = f.id`

const asMoney = value => Number(Number(value || 0).toFixed(2))

export const obtenerEstadoIntegracionSii = (_req, res) => {
  const requiredCredentials = ['LIBREDTE_HASH', 'LIBREDTE_RUT']
  const missingCredentials = requiredCredentials.filter(key => !process.env[key]?.trim())

  res.json({
    provider: 'LibreDTE',
    pilotMode: true,
    integrationImplemented: false,
    issuanceEnabled: false,
    credentialsConfigured: missingCredentials.length === 0,
    missingCredentials
  })
}

export const obtenerFacturacion = async (_req, res) => {
  try {
    const [invoices, orders] = await Promise.all([
      pool.query(`${invoiceSelect} ORDER BY f.created_at DESC, f.id DESC`),
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
      invoices: invoices.rows.map(row => ({
        ...row,
        subtotal: Number(row.subtotal),
        discount: Number(row.discount),
        taxRate: Number(row.taxRate),
        tax: Number(row.tax),
        total: Number(row.total),
        amountPaid: Number(row.amountPaid),
        balance: Number(row.balance)
      })),
      orders: orders.rows.map(row => ({ ...row, total: Number(row.total) }))
    })
  } catch (error) {
    console.error('Error al obtener facturación:', error.message)
    res.status(500).json({ error: 'No se pudo cargar la facturación desde la base de datos' })
  }
}

export const obtenerFactura = async (req, res) => {
  try {
    const invoice = await pool.query(`${invoiceSelect} WHERE f.id = $1`, [req.params.id])
    if (!invoice.rows[0]) return res.status(404).json({ error: 'Factura no encontrada' })

    const [items, payments] = await Promise.all([
      pool.query(
        `SELECT id, tipo AS type, nombre AS name, codigo AS code, precio AS price, cantidad AS quantity
         FROM taller_factura_items WHERE factura_id = $1 ORDER BY id`,
        [req.params.id]
      ),
      pool.query(
        `SELECT id, monto AS amount, metodo AS method, observacion AS note, pagado_en AS date
         FROM taller_factura_pagos WHERE factura_id = $1 ORDER BY pagado_en, id`,
        [req.params.id]
      )
    ])

    const row = invoice.rows[0]
    res.json({
      ...row,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      taxRate: Number(row.taxRate),
      tax: Number(row.tax),
      total: Number(row.total),
      amountPaid: Number(row.amountPaid),
      balance: Number(row.balance),
      items: items.rows.map(item => ({ ...item, price: Number(item.price), quantity: Number(item.quantity) })),
      payments: payments.rows.map(payment => ({ ...payment, amount: Number(payment.amount) }))
    })
  } catch (error) {
    console.error('Error al obtener detalle de factura:', error.message)
    res.status(500).json({ error: 'No se pudo cargar el detalle de la factura' })
  }
}

export const crearFactura = async (req, res) => {
  const client = await pool.connect()
  let transactionStarted = false
  const options = req.body || {}

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

    await client.query(
      'SELECT id FROM taller_ingreso_items WHERE ingreso_id = $1 ORDER BY id FOR SHARE',
      [req.params.id]
    )
    const totalResult = await client.query(
      'SELECT COALESCE(SUM(precio * cantidad), 0) AS total FROM taller_ingreso_items WHERE ingreso_id = $1',
      [req.params.id]
    )
    const subtotal = asMoney(totalResult.rows[0].total)
    if (subtotal <= 0) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(400).json({ error: 'Agrega trabajos o repuestos antes de facturar' })
    }

    const discount = asMoney(options.discount)
    let taxRate = Number(options.taxRate ?? 0)
    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(400).json({ error: 'El descuento debe estar entre 0 y el subtotal' })
    }
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(400).json({ error: 'El IVA debe estar entre 0% y 100%' })
    }
    taxRate = asMoney(taxRate)
    if (taxRate > 100) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(400).json({ error: 'El IVA debe estar entre 0% y 100%' })
    }

    const taxableAmount = asMoney(subtotal - discount)
    const tax = asMoney(taxableAmount * taxRate / 100)
    const total = asMoney(taxableAmount + tax)
    const number = `FAC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const result = await client.query(
      `INSERT INTO taller_facturas (numero, ingreso_id, subtotal, descuento, iva_porcentaje, iva, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, numero AS number, ingreso_id AS "entryId",
                 estado AS status, subtotal, descuento AS discount,
                 iva_porcentaje AS "taxRate", iva AS tax, total, created_at AS created`,
      [number, req.params.id, subtotal, discount, taxRate, tax, total]
    )

    await client.query(
      `INSERT INTO taller_factura_items (factura_id, tipo, nombre, codigo, precio, cantidad)
       SELECT $1, tipo, nombre, codigo, precio, cantidad
       FROM taller_ingreso_items WHERE ingreso_id = $2 ORDER BY id`,
      [result.rows[0].id, req.params.id]
    )
    await client.query('COMMIT')
    transactionStarted = false
    const row = result.rows[0]
    res.status(201).json({
      ...row,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      taxRate: Number(row.taxRate),
      tax: Number(row.tax),
      total: Number(row.total)
    })
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

export const registrarPagoFactura = async (req, res) => {
  const client = await pool.connect()
  let transactionStarted = false
  try {
    const body = req.body || {}
    const amount = asMoney(body.amount)
    const method = String(body.method || 'Otro').trim()
    const note = String(body.note || '').trim() || null
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'El monto del pago debe ser mayor que cero' })
    }
    if (note && note.length > 500) {
      return res.status(400).json({ error: 'La observación no puede superar 500 caracteres' })
    }
    if (!['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'].includes(method)) {
      return res.status(400).json({ error: 'Método de pago no válido' })
    }

    await client.query('BEGIN')
    transactionStarted = true
    const invoice = await client.query(
      'SELECT id, total, estado FROM taller_facturas WHERE id = $1 FOR UPDATE',
      [req.params.id]
    )
    if (!invoice.rows[0]) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(404).json({ error: 'Factura no encontrada' })
    }
    if (invoice.rows[0].estado === 'Anulada') {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(409).json({ error: 'No se puede registrar un pago en una factura anulada' })
    }

    const paid = await client.query(
      'SELECT COALESCE(SUM(monto), 0) AS total FROM taller_factura_pagos WHERE factura_id = $1',
      [req.params.id]
    )
    const balance = asMoney(Number(invoice.rows[0].total) - Number(paid.rows[0].total))
    if (amount > balance) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(400).json({ error: 'El pago no puede superar el saldo pendiente' })
    }

    const payment = await client.query(
      `INSERT INTO taller_factura_pagos (factura_id, monto, metodo, observacion)
       VALUES ($1, $2, $3, $4)
       RETURNING id, monto AS amount, metodo AS method, observacion AS note, pagado_en AS date`,
      [req.params.id, asMoney(amount), method, note]
    )
    const amountPaid = asMoney(Number(paid.rows[0].total) + amount)
    const status = amountPaid >= Number(invoice.rows[0].total) ? 'Pagada' : 'Abonada'
    await client.query('UPDATE taller_facturas SET estado = $1 WHERE id = $2', [status, req.params.id])
    await client.query('COMMIT')
    transactionStarted = false
    res.status(201).json({
      payment: { ...payment.rows[0], amount: Number(payment.rows[0].amount) },
      amountPaid,
      balance: asMoney(balance - amount),
      status
    })
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK')
    console.error('Error al registrar pago de factura:', error.message)
    res.status(500).json({ error: 'No se pudo registrar el pago' })
  } finally {
    client.release()
  }
}

export const anularFactura = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE taller_facturas SET estado = 'Anulada', anulada_en = NOW()
       WHERE id = $1 AND estado <> 'Anulada'
       RETURNING id, numero AS number, estado AS status, anulada_en AS "cancelledAt"`,
      [req.params.id]
    )
    if (!result.rows[0]) {
      const current = await pool.query('SELECT id FROM taller_facturas WHERE id = $1', [req.params.id])
      if (!current.rows[0]) return res.status(404).json({ error: 'Factura no encontrada' })
      return res.status(409).json({ error: 'La factura ya está anulada' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error al anular factura:', error.message)
    res.status(500).json({ error: 'No se pudo anular la factura' })
  }
}