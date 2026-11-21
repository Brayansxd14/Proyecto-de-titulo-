import { mkdir, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import pool from '../db.js'
import { readSpreadsheet, valueFrom } from '../utils/spreadsheet.js'

const clean = value => typeof value === 'string' ? value.trim() : value
const orderStatuses = ['Pendiente', 'En reparación', 'Esperando repuestos', 'Listo', 'Cerrado']
const finiteNumber = value => value !== '' && value !== null && Number.isFinite(Number(value))

export const obtenerTaller = async (req, res) => {
  try {
    const [clients, vehicles, labor, entries, items, photos, quotes, quoteItems] = await Promise.all([
      pool.query('SELECT id, nombre AS name, rut, telefono AS phone, email FROM taller_clientes ORDER BY nombre'),
      pool.query('SELECT id, patente AS plate, marca AS brand, modelo AS model, anio AS year, cliente_id AS "clientId", kilometraje AS km FROM taller_vehiculos ORDER BY patente'),
      pool.query('SELECT id, codigo AS code, nombre AS name, unidad AS unit, precio AS price, duracion AS duration FROM taller_mano_obra ORDER BY nombre'),
      pool.query('SELECT i.id, i.numero AS number, i.vehiculo_id AS "vehicleId", v.patente AS plate, i.fecha AS date, TO_CHAR(i.hora, \'HH24:MI\') AS time, i.descripcion AS description, i.observaciones AS observations, i.estado AS status FROM taller_ingresos i JOIN taller_vehiculos v ON v.id = i.vehiculo_id ORDER BY i.id DESC'),
      pool.query('SELECT id AS "itemId", ingreso_id AS "entryId", tipo AS type, nombre AS name, codigo AS code, precio AS price, cantidad AS quantity, duracion AS duration FROM taller_ingreso_items'),
      pool.query('SELECT id, ingreso_id AS "entryId", nombre_original AS "originalName", nombre_archivo AS "fileName", ruta AS path FROM taller_fotos ORDER BY id'),
      pool.query('SELECT id, numero AS number, ingreso_id AS "entryId", estado AS status, total, created_at AS created FROM taller_presupuestos ORDER BY id DESC'),
      pool.query('SELECT presupuesto_id AS "quoteId", tipo AS type, nombre AS name, codigo AS code, precio AS price, cantidad AS quantity, duracion AS duration FROM taller_presupuesto_items ORDER BY id')
    ])
    const entryData = entries.rows.map(entry => ({ ...entry, items: items.rows.filter(item => item.entryId === entry.id), photos: photos.rows.filter(photo => photo.entryId === entry.id) }))
    res.json({
      clients: clients.rows,
      vehicles: vehicles.rows,
      labor: labor.rows.map(row => ({ ...row, price: Number(row.price) })),
      entries: entryData,
      quotes: quotes.rows.map(quote => ({
        ...quote,
        total: Number(quote.total),
        items: quoteItems.rows
          .filter(item => item.quoteId === quote.id)
          .map(item => ({
            type: item.type,
            name: item.name,
            code: item.code,
            price: Number(item.price),
            quantity: Number(item.quantity),
            duration: item.duration
          }))
      }))
    })
  } catch (error) {
    console.error('Error al obtener datos del taller:', error.message)
    res.status(500).send('Error al obtener datos del taller')
  }
}

export const crearCliente = async (req, res) => {
  try {
    const { name, rut, phone, email } = req.body
    if (!clean(name) || !clean(rut)) return res.status(400).send('Nombre y RUT son obligatorios')
    const result = await pool.query('INSERT INTO taller_clientes (nombre, rut, telefono, email) VALUES ($1, $2, $3, $4) RETURNING id, nombre AS name, rut, telefono AS phone, email', [clean(name), clean(rut), clean(phone) || null, clean(email) || null])
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(error.code === '23505' ? 409 : 500).send(error.code === '23505' ? 'Ya existe un cliente con ese RUT' : 'Error al crear cliente') }
}

export const crearVehiculo = async (req, res) => {
  try {
    const { plate, brand, model, year, clientId, km } = req.body
    if (!clean(plate) || !clean(brand) || !clean(model) || !Number.isInteger(Number(clientId)) || Number(clientId) <= 0) {
      return res.status(400).send('Patente, cliente, marca y modelo son obligatorios')
    }
    const result = await pool.query('INSERT INTO taller_vehiculos (patente, marca, modelo, anio, cliente_id, kilometraje) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, patente AS plate, marca AS brand, modelo AS model, anio AS year, cliente_id AS "clientId", kilometraje AS km', [clean(plate).toUpperCase(), clean(brand), clean(model), clean(year) || null, clientId, clean(km) || null])
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error al crear vehículo:', error.message)
    if (error.code === '23505') return res.status(409).send('Ya existe un vehículo con esa patente')
    if (error.code === '23503') return res.status(400).send('El cliente seleccionado no existe')
    res.status(500).send('Error al crear vehículo')
  }
}

export const crearManoObra = async (req, res) => {
  try {
    const { name, code, price = 0, duration } = req.body
    if (!clean(name) || !finiteNumber(price) || Number(price) < 0) return res.status(400).send('La descripción y un precio válido son obligatorios')
    const result = await pool.query('INSERT INTO taller_mano_obra (codigo, nombre, unidad, precio, duracion) VALUES ($1, $2, $3, $4, $5) RETURNING id, codigo AS code, nombre AS name, unidad AS unit, precio AS price, duracion AS duration', [clean(code) || null, clean(name), 'Hora', Number(price) || 0, clean(duration) || null])
    res.status(201).json({ ...result.rows[0], price: Number(result.rows[0].price) })
  } catch (error) {
    console.error('Error al crear mano de obra:', error.message)
    res.status(500).send('Error al crear mano de obra')
  }
}

export const crearIngreso = async (req, res) => {
  const client = await pool.connect()
  try {
    const { number, plate, date, time, description } = req.body
    if (!clean(number) || !clean(plate) || !clean(date) || !clean(time) || !clean(description)) {
      return res.status(400).send('Número, patente, fecha, hora y motivo son obligatorios')
    }
    const vehicle = await client.query('SELECT id, patente AS plate FROM taller_vehiculos WHERE patente = $1', [clean(plate)?.toUpperCase()])
    if (!vehicle.rows[0]) return res.status(400).send('Vehículo no encontrado')
    const result = await client.query('INSERT INTO taller_ingresos (numero, vehiculo_id, fecha, hora, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING id, numero AS number, vehiculo_id AS "vehicleId", fecha AS date, TO_CHAR(hora, \'HH24:MI\') AS time, descripcion AS description, observaciones AS observations, estado AS status', [clean(number), vehicle.rows[0].id, date, time, clean(description)])
    res.status(201).json({ ...result.rows[0], plate: vehicle.rows[0].plate, items: [], photos: [] })
  } catch (error) {
    console.error('Error al crear ingreso:', error.message)
    res.status(error.code === '23505' ? 409 : 400).send(error.code === '23505' ? 'Ese número de ingreso ya existe' : 'No se pudo crear el ingreso; revisa los datos ingresados')
  } finally { client.release() }
}

export const actualizarIngreso = async (req, res) => {
  const client = await pool.connect()
  let transactionOpen = false
  try {
    const { description, observations, status } = req.body
    if (description === undefined && observations === undefined && status === undefined) return res.status(400).send('No se recibieron cambios')
    if (status !== undefined && !orderStatuses.includes(clean(status))) return res.status(400).send('Estado de ingreso no válido')
    if ((description !== undefined && typeof description !== 'string') || (observations !== undefined && typeof observations !== 'string')) return res.status(400).send('La descripción u observaciones no son válidas')
    await client.query('BEGIN')
    transactionOpen = true
    const entry = await client.query(
      'SELECT estado, stock_descontado FROM taller_ingresos WHERE id = $1 FOR UPDATE',
      [req.params.id]
    )
    if (!entry.rows[0]) {
      const error = new Error('Ingreso no encontrado')
      error.statusCode = 404
      throw error
    }

    const currentStatus = entry.rows[0].estado
    const nextStatus = status === undefined ? currentStatus : clean(status)
    if (currentStatus !== 'Cerrado' && nextStatus === 'Cerrado') {
      const parts = await client.query(
        `SELECT codigo, SUM(cantidad) AS cantidad
         FROM taller_ingreso_items
         WHERE ingreso_id = $1 AND tipo = 'part'
         GROUP BY codigo
         ORDER BY codigo`,
        [req.params.id]
      )
      for (const part of parts.rows) {
        const quantity = Number(part.cantidad)
        if (!part.codigo || !Number.isInteger(quantity) || quantity <= 0) {
          const error = new Error('Cada repuesto debe tener código de Inventario y una cantidad entera')
          error.statusCode = 400
          throw error
        }
        const stock = await client.query(
          'SELECT cantidad FROM inventario WHERE numero_serie = $1 FOR UPDATE',
          [part.codigo]
        )
        if (!stock.rows[0]) {
          const error = new Error(`El repuesto ${part.codigo} ya no existe en Inventario`)
          error.statusCode = 409
          throw error
        }
        if (Number(stock.rows[0].cantidad) < quantity) {
          const error = new Error(`Stock insuficiente para ${part.codigo}; disponible: ${stock.rows[0].cantidad}, requerido: ${quantity}`)
          error.statusCode = 409
          throw error
        }
        await client.query(
          `UPDATE inventario
           SET cantidad = cantidad - $1,
               estado = CASE WHEN cantidad - $1 > 0 THEN 'con stock' ELSE 'sin stock' END
           WHERE numero_serie = $2`,
          [quantity, part.codigo]
        )
        await client.query(
          'INSERT INTO taller_stock_consumos (ingreso_id, codigo, cantidad) VALUES ($1, $2, $3)',
          [req.params.id, part.codigo, quantity]
        )
      }
      await client.query('UPDATE taller_ingresos SET stock_descontado = TRUE WHERE id = $1', [req.params.id])
    } else if (currentStatus === 'Cerrado' && nextStatus !== 'Cerrado' && entry.rows[0].stock_descontado) {
      const consumptions = await client.query(
        `SELECT id, codigo, cantidad
         FROM taller_stock_consumos
         WHERE ingreso_id = $1 AND devuelto_en IS NULL
         ORDER BY codigo
         FOR UPDATE`,
        [req.params.id]
      )
      for (const consumption of consumptions.rows) {
        const restored = await client.query(
          `UPDATE inventario
           SET cantidad = cantidad + $1,
               estado = CASE WHEN cantidad + $1 > 0 THEN 'con stock' ELSE 'sin stock' END
           WHERE numero_serie = $2
           RETURNING numero_serie`,
          [consumption.cantidad, consumption.codigo]
        )
        if (!restored.rows[0]) {
          const error = new Error(`No se puede reabrir la orden: el repuesto ${consumption.codigo} no existe en Inventario`)
          error.statusCode = 409
          throw error
        }
        await client.query(
          'UPDATE taller_stock_consumos SET devuelto_en = NOW() WHERE id = $1',
          [consumption.id]
        )
      }
      await client.query('UPDATE taller_ingresos SET stock_descontado = FALSE WHERE id = $1', [req.params.id])
    }

    const result = await client.query(
      `UPDATE taller_ingresos
       SET descripcion = CASE WHEN $1::boolean THEN $2 ELSE descripcion END,
           observaciones = CASE WHEN $3::boolean THEN $4 ELSE observaciones END,
           estado = CASE WHEN $5::boolean THEN $6 ELSE estado END
       WHERE id = $7
       RETURNING id, numero AS number, vehiculo_id AS "vehicleId", fecha AS date,
                 TO_CHAR(hora, 'HH24:MI') AS time, descripcion AS description,
                 observaciones AS observations, estado AS status`,
      [description !== undefined, description === undefined ? null : clean(description), observations !== undefined, observations === undefined ? null : clean(observations), status !== undefined, status === undefined ? null : clean(status), req.params.id]
    )
    await client.query('COMMIT')
    transactionOpen = false
    res.json(result.rows[0])
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK')
    if (error.statusCode) return res.status(error.statusCode).send(error.message)
    console.error('Error al actualizar ingreso:', error.message)
    res.status(500).send('Error al actualizar ingreso')
  } finally { client.release() }
}

export const agregarItem = async (req, res) => {
  const client = await pool.connect()
  let transactionOpen = false
  try {
    const { type, name, code, price, quantity = 1, duration } = req.body
    if (!['labor', 'part'].includes(type) || !clean(name) || !finiteNumber(price) || Number(price) < 0 || !finiteNumber(quantity) || Number(quantity) <= 0) {
      return res.status(400).send('Tipo, descripción, precio y cantidad deben ser válidos')
    }
    if (type === 'part' && (!clean(code) || !Number.isInteger(Number(quantity)))) {
      return res.status(400).send('El repuesto requiere un código de inventario y una cantidad entera')
    }
    await client.query('BEGIN')
    transactionOpen = true
    const entry = await client.query('SELECT estado FROM taller_ingresos WHERE id = $1 FOR UPDATE', [req.params.id])
    if (!entry.rows[0]) {
      await client.query('ROLLBACK')
      transactionOpen = false
      return res.status(404).send('Ingreso no encontrado')
    }
    if (entry.rows[0].estado === 'Cerrado') {
      await client.query('ROLLBACK')
      transactionOpen = false
      return res.status(409).send('Reabre la orden antes de agregar conceptos')
    }
    if (type === 'part') {
      const stock = await client.query('SELECT cantidad FROM inventario WHERE numero_serie = $1 FOR SHARE', [clean(code)])
      if (!stock.rows[0]) {
        await client.query('ROLLBACK')
        transactionOpen = false
        return res.status(400).send('El repuesto debe existir en Inventario antes de asociarlo a la orden')
      }
      if (Number(stock.rows[0].cantidad) < Number(quantity)) {
        await client.query('ROLLBACK')
        transactionOpen = false
        return res.status(409).send(`Stock insuficiente para ${clean(code)}; disponible: ${stock.rows[0].cantidad}`)
      }
    }
    const result = await client.query(
      `INSERT INTO taller_ingreso_items (ingreso_id, tipo, nombre, codigo, precio, cantidad, duracion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id AS "itemId", ingreso_id AS "entryId", tipo AS type, nombre AS name,
                 codigo AS code, precio AS price, cantidad AS quantity, duracion AS duration`,
      [req.params.id, type, clean(name), clean(code) || null, Number(price), Number(quantity), clean(duration) || null]
    )
    await client.query('COMMIT')
    transactionOpen = false
    res.status(201).json({ ...result.rows[0], price: Number(result.rows[0].price) })
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK')
    console.error('Error al agregar ítem:', error.message)
    res.status(500).send('Error al agregar ítem')
  } finally { client.release() }
}

export const actualizarItem = async (req, res) => {
  const client = await pool.connect()
  let transactionOpen = false
  try {
    const { price, quantity } = req.body
    if (!finiteNumber(price) || Number(price) < 0 || !finiteNumber(quantity) || Number(quantity) <= 0) {
      return res.status(400).send('Precio y cantidad deben ser válidos')
    }
    await client.query('BEGIN')
    transactionOpen = true
    const entry = await client.query('SELECT estado FROM taller_ingresos WHERE id = $1 FOR UPDATE', [req.params.id])
    if (!entry.rows[0]) {
      await client.query('ROLLBACK')
      transactionOpen = false
      return res.status(404).send('Ingreso no encontrado')
    }
    if (entry.rows[0].estado === 'Cerrado') {
      await client.query('ROLLBACK')
      transactionOpen = false
      return res.status(409).send('Reabre la orden antes de modificar conceptos')
    }
    const item = await client.query(
      'SELECT tipo FROM taller_ingreso_items WHERE id = $1 AND ingreso_id = $2',
      [req.params.itemId, req.params.id]
    )
    if (!item.rows[0]) {
      await client.query('ROLLBACK')
      transactionOpen = false
      return res.status(404).send('Ítem no encontrado')
    }
    if (item.rows[0].tipo === 'part' && !Number.isInteger(Number(quantity))) {
      await client.query('ROLLBACK')
      transactionOpen = false
      return res.status(400).send('La cantidad de repuestos debe ser entera')
    }
    const result = await client.query(
      'UPDATE taller_ingreso_items SET precio = $1, cantidad = $2 WHERE id = $3 AND ingreso_id = $4 RETURNING id AS "itemId", ingreso_id AS "entryId", tipo AS type, nombre AS name, codigo AS code, precio AS price, cantidad AS quantity, duracion AS duration',
      [Number(price), Number(quantity), req.params.itemId, req.params.id]
    )
    await client.query('COMMIT')
    transactionOpen = false
    res.json({ ...result.rows[0], price: Number(result.rows[0].price) })
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK')
    console.error('Error al actualizar ítem:', error.message)
    res.status(500).send('Error al actualizar ítem')
  } finally { client.release() }
}

export const eliminarItem = async (req, res) => {
  const client = await pool.connect()
  let transactionOpen = false
  try {
    await client.query('BEGIN')
    transactionOpen = true
    const entry = await client.query('SELECT estado FROM taller_ingresos WHERE id = $1 FOR UPDATE', [req.params.id])
    if (!entry.rows[0]) {
      await client.query('ROLLBACK')
      transactionOpen = false
      return res.status(404).send('Ingreso no encontrado')
    }
    if (entry.rows[0].estado === 'Cerrado') {
      await client.query('ROLLBACK')
      transactionOpen = false
      return res.status(409).send('Reabre la orden antes de quitar conceptos')
    }
    const result = await client.query('DELETE FROM taller_ingreso_items WHERE id = $1 AND ingreso_id = $2 RETURNING id', [req.params.itemId, req.params.id])
    if (!result.rows[0]) {
      await client.query('ROLLBACK')
      transactionOpen = false
      return res.status(404).send('Ítem no encontrado')
    }
    await client.query('COMMIT')
    transactionOpen = false
    res.json({ deleted: true })
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK')
    console.error('Error al eliminar ítem:', error.message)
    res.status(500).send('Error al eliminar ítem')
  } finally { client.release() }
}

export const crearDocumento = tipo => async (req, res) => {
  const client = await pool.connect()
  try {
    if (tipo !== 'presupuesto') return res.status(400).send('Tipo de documento no válido')
    await client.query('BEGIN')
    const entry = await client.query('SELECT id FROM taller_ingresos WHERE id = $1 FOR UPDATE', [req.params.id])
    if (!entry.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).send('Ingreso no encontrado')
    }
    const items = await client.query(
      `SELECT tipo AS type, nombre AS name, codigo AS code, precio AS price,
              cantidad AS quantity, duracion AS duration
       FROM taller_ingreso_items WHERE ingreso_id = $1 ORDER BY id FOR SHARE`,
      [req.params.id]
    )
    if (!items.rows.length) {
      await client.query('ROLLBACK')
      return res.status(400).send('Agrega trabajos o repuestos antes de generar un presupuesto')
    }
    const total = await client.query(
      'SELECT COALESCE(SUM(precio * cantidad), 0) AS total FROM taller_ingreso_items WHERE ingreso_id = $1',
      [req.params.id]
    )
    const number = `PRES-${randomUUID().slice(0, 8).toUpperCase()}`
    const result = await client.query(
      `INSERT INTO taller_presupuestos (numero, ingreso_id, total)
       VALUES ($1, $2, $3)
       RETURNING id, numero AS number, ingreso_id AS "entryId", estado AS status, total, created_at AS created`,
      [number, req.params.id, total.rows[0].total]
    )
    for (const item of items.rows) {
      await client.query(
        `INSERT INTO taller_presupuesto_items (presupuesto_id, tipo, nombre, codigo, precio, cantidad, duracion)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [result.rows[0].id, item.type, item.name, item.code, item.price, item.quantity, item.duration]
      )
    }
    await client.query('COMMIT')
    res.status(201).json({
      ...result.rows[0],
      total: Number(result.rows[0].total),
      items: items.rows.map(item => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity)
      }))
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(`Error al crear ${tipo}:`, error.message)
    res.status(500).send(`Error al crear ${tipo}`)
  } finally { client.release() }
}

export const eliminarDocumento = tipo => async (req, res) => {
  try {
    if (tipo !== 'presupuesto') return res.status(400).send('Tipo de documento no válido')
    const result = await pool.query('DELETE FROM taller_presupuestos WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows[0]) return res.status(404).send(`${tipo} no encontrado`)
    res.json({ deleted: true })
  } catch (error) {
    console.error(`Error al eliminar ${tipo}:`, error.message)
    res.status(500).send(`Error al eliminar ${tipo}`)
  }
}

export const subirFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Debes adjuntar una imagen')
    const result = await pool.query('INSERT INTO taller_fotos (ingreso_id, nombre_original, nombre_archivo, ruta) VALUES ($1, $2, $3, $4) RETURNING id, ingreso_id AS "entryId", nombre_original AS "originalName", nombre_archivo AS "fileName", ruta AS path', [req.params.id, req.file.originalname, req.file.filename, `/uploads/ingresos/${req.file.filename}`])
    res.status(201).json(result.rows[0])
  } catch (error) {
    if (req.file) {
      await unlink(req.file.path).catch(cleanupError =>
        console.error('No se pudo limpiar un archivo de foto fallido:', cleanupError.message)
      )
    }
    console.error('Error al guardar la foto:', error.message)
    res.status(error.code === '23503' ? 404 : 500).send(error.code === '23503' ? 'Ingreso no encontrado' : 'Error al guardar la foto')
  }
}

export const prepararCarpetaFotos = async () => mkdir(path.resolve('uploads/ingresos'), { recursive: true })

const importRows = async (req, res, table, handler) => {
  if (!req.file) return res.status(400).json({ message: 'Selecciona un archivo Excel o CSV' })
  const client = await pool.connect()
  const errors = []
  let imported = 0
  try {
    const rows = readSpreadsheet(req.file.buffer)
    if (!rows.length) return res.status(400).json({ message: 'El archivo no contiene filas de datos' })
    await client.query('BEGIN')
    for (const [index, row] of rows.entries()) {
      const savepoint = `import_row_${index}`
      await client.query(`SAVEPOINT ${savepoint}`)
      try {
        await handler(client, row)
        await client.query(`RELEASE SAVEPOINT ${savepoint}`)
        imported += 1
      } catch (error) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`)
        await client.query(`RELEASE SAVEPOINT ${savepoint}`)
        errors.push({ fila: index + 2, motivo: error.message })
      }
    }
    await client.query('COMMIT')
    res.json({ imported, rejected: errors.length, errors, table })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(`Error al importar ${table}:`, error.message)
    res.status(500).json({ message: 'No se pudo importar el archivo' })
  } finally { client.release() }
}

export const importarClientes = (req, res) => importRows(req, res, 'clientes', async (client, row) => {
  const name = String(valueFrom(row, ['nombre', 'name', 'razonsocial']) || '').trim()
  const rut = String(valueFrom(row, ['rut', 'identificacion']) || '').trim()
  if (!name || !rut) throw new Error('Faltan nombre y RUT')
  await client.query(`INSERT INTO taller_clientes (nombre, rut, telefono, email) VALUES ($1, $2, $3, $4)
    ON CONFLICT (rut) DO UPDATE SET nombre = EXCLUDED.nombre, telefono = EXCLUDED.telefono, email = EXCLUDED.email`,
  [name, rut, valueFrom(row, ['telefono', 'celular', 'phone']) || null, valueFrom(row, ['email', 'correo']) || null])
})

export const importarVehiculos = (req, res) => importRows(req, res, 'vehiculos', async (client, row) => {
  const plate = String(valueFrom(row, ['patente', 'plate']) || '').trim().toUpperCase()
  const brand = String(valueFrom(row, ['marca', 'brand']) || '').trim()
  const model = String(valueFrom(row, ['modelo', 'model']) || '').trim()
  const clientId = valueFrom(row, ['clienteid', 'clientid'])
  const clientRut = String(valueFrom(row, ['clienterut', 'rutcliente']) || '').trim()
  if (!plate || !brand || !model || (!clientId && !clientRut)) throw new Error('Faltan patente, marca, modelo y cliente_id o cliente_rut')
  const clientResult = clientId
    ? await client.query('SELECT id FROM taller_clientes WHERE id = $1', [Number(clientId)])
    : await client.query('SELECT id FROM taller_clientes WHERE rut = $1', [clientRut])
  if (!clientResult.rows[0]) throw new Error('Cliente no encontrado')
  await client.query(`INSERT INTO taller_vehiculos (patente, marca, modelo, anio, cliente_id, kilometraje) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (patente) DO UPDATE SET marca = EXCLUDED.marca, modelo = EXCLUDED.modelo, anio = EXCLUDED.anio, cliente_id = EXCLUDED.cliente_id, kilometraje = EXCLUDED.kilometraje`,
  [plate, brand, model, valueFrom(row, ['anio', 'ano', 'year']) || null, clientResult.rows[0].id, valueFrom(row, ['kilometraje', 'km']) || null])
})