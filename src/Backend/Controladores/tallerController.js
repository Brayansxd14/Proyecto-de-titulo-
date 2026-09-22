import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import pool from '../db.js'
import { readSpreadsheet, valueFrom } from '../utils/spreadsheet.js'

const clean = value => typeof value === 'string' ? value.trim() : value

export const obtenerTaller = async (req, res) => {
  try {
    const [clients, vehicles, labor, entries, items, photos, quotes, invoices] = await Promise.all([
      pool.query('SELECT id, nombre AS name, rut, telefono AS phone, email FROM taller_clientes ORDER BY nombre'),
      pool.query('SELECT id, patente AS plate, marca AS brand, modelo AS model, anio AS year, cliente_id AS "clientId", kilometraje AS km FROM taller_vehiculos ORDER BY patente'),
      pool.query('SELECT id, codigo AS code, nombre AS name, unidad AS unit, precio AS price, duracion AS duration FROM taller_mano_obra ORDER BY nombre'),
      pool.query('SELECT id, numero AS number, vehiculo_id AS "vehicleId", fecha AS date, TO_CHAR(hora, \'HH24:MI\') AS time, descripcion AS description, estado AS status FROM taller_ingresos ORDER BY id DESC'),
      pool.query('SELECT id AS "itemId", ingreso_id AS "entryId", tipo AS type, nombre AS name, codigo AS code, precio AS price, cantidad AS quantity, duracion AS duration FROM taller_ingreso_items'),
      pool.query('SELECT id, ingreso_id AS "entryId", nombre_original AS "originalName", nombre_archivo AS "fileName", ruta AS path FROM taller_fotos ORDER BY id'),
      pool.query('SELECT id, numero AS number, ingreso_id AS "entryId", estado AS status, total, created_at AS created FROM taller_presupuestos ORDER BY id DESC'),
      pool.query('SELECT id, numero AS number, ingreso_id AS "entryId", estado AS status, total, created_at AS created FROM taller_facturas ORDER BY id DESC')
    ])
    const entryData = entries.rows.map(entry => ({ ...entry, items: items.rows.filter(item => item.entryId === entry.id), photos: photos.rows.filter(photo => photo.entryId === entry.id) }))
    res.json({ clients: clients.rows, vehicles: vehicles.rows, labor: labor.rows.map(row => ({ ...row, price: Number(row.price) })), entries: entryData, quotes: quotes.rows.map(row => ({ ...row, total: Number(row.total) })), invoices: invoices.rows.map(row => ({ ...row, total: Number(row.total) })) })
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
    if (!clean(plate) || !clean(brand) || !clean(model) || !clientId) return res.status(400).send('Patente, cliente, marca y modelo son obligatorios')
    const result = await pool.query('INSERT INTO taller_vehiculos (patente, marca, modelo, anio, cliente_id, kilometraje) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, patente AS plate, marca AS brand, modelo AS model, anio AS year, cliente_id AS "clientId", kilometraje AS km', [clean(plate).toUpperCase(), clean(brand), clean(model), clean(year) || null, clientId, clean(km) || null])
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(error.code === '23505' ? 409 : 500).send(error.code === '23505' ? 'Ya existe un vehículo con esa patente' : 'Error al crear vehículo') }
}

export const crearManoObra = async (req, res) => {
  try {
    const { name, code, price = 0, duration } = req.body
    if (!clean(name)) return res.status(400).send('La descripción es obligatoria')
    const result = await pool.query('INSERT INTO taller_mano_obra (codigo, nombre, unidad, precio, duracion) VALUES ($1, $2, $3, $4, $5) RETURNING id, codigo AS code, nombre AS name, unidad AS unit, precio AS price, duracion AS duration', [clean(code) || null, clean(name), 'Hora', Number(price) || 0, clean(duration) || null])
    res.status(201).json({ ...result.rows[0], price: Number(result.rows[0].price) })
  } catch { res.status(500).send('Error al crear mano de obra') }
}

export const crearIngreso = async (req, res) => {
  const client = await pool.connect()
  try {
    const { number, plate, date, time, description } = req.body
    const vehicle = await client.query('SELECT id FROM taller_vehiculos WHERE patente = $1', [clean(plate)?.toUpperCase()])
    if (!vehicle.rows[0]) return res.status(400).send('Vehículo no encontrado')
    const result = await client.query('INSERT INTO taller_ingresos (numero, vehiculo_id, fecha, hora, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING id, numero AS number, vehiculo_id AS "vehicleId", fecha AS date, TO_CHAR(hora, \'HH24:MI\') AS time, descripcion AS description, estado AS status', [clean(number), vehicle.rows[0].id, date, time, clean(description)])
    res.status(201).json({ ...result.rows[0], items: [], photos: [] })
  } catch (error) { res.status(error.code === '23505' ? 409 : 500).send(error.code === '23505' ? 'Ese número de ingreso ya existe' : 'Error al crear ingreso') } finally { client.release() }
}

export const actualizarIngreso = async (req, res) => {
  try {
    const { description, status } = req.body
    const result = await pool.query('UPDATE taller_ingresos SET descripcion = COALESCE($1, descripcion), estado = COALESCE($2, estado) WHERE id = $3 RETURNING id, descripcion AS description, estado AS status', [clean(description) || null, clean(status) || null, req.params.id])
    if (!result.rows[0]) return res.status(404).send('Ingreso no encontrado')
    res.json(result.rows[0])
  } catch { res.status(500).send('Error al actualizar ingreso') }
}

export const agregarItem = async (req, res) => {
  try {
    const { type, name, code, price, quantity = 1, duration } = req.body
    const result = await pool.query('INSERT INTO taller_ingreso_items (ingreso_id, tipo, nombre, codigo, precio, cantidad, duracion) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id AS "itemId", ingreso_id AS "entryId", tipo AS type, nombre AS name, codigo AS code, precio AS price, cantidad AS quantity, duracion AS duration', [req.params.id, type, clean(name), clean(code) || null, Number(price) || 0, Number(quantity) || 1, clean(duration) || null])
    res.status(201).json({ ...result.rows[0], price: Number(result.rows[0].price) })
  } catch { res.status(500).send('Error al agregar ítem') }
}

export const actualizarItem = async (req, res) => {
  try {
    const { price, quantity } = req.body
    const result = await pool.query(
      'UPDATE taller_ingreso_items SET precio = $1, cantidad = $2 WHERE id = $3 RETURNING id AS "itemId", ingreso_id AS "entryId", tipo AS type, nombre AS name, codigo AS code, precio AS price, cantidad AS quantity, duracion AS duration',
      [Math.max(0, Number(price) || 0), Math.max(0.25, Number(quantity) || 1), req.params.itemId]
    )
    if (!result.rows[0]) return res.status(404).send('Ítem no encontrado')
    res.json({ ...result.rows[0], price: Number(result.rows[0].price) })
  } catch { res.status(500).send('Error al actualizar ítem') }
}

export const eliminarItem = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM taller_ingreso_items WHERE id = $1 RETURNING id', [req.params.itemId])
    if (!result.rows[0]) return res.status(404).send('Ítem no encontrado')
    res.json({ deleted: true })
  } catch { res.status(500).send('Error al eliminar ítem') }
}

export const crearDocumento = tipo => async (req, res) => {
  try {
    const table = tipo === 'factura' ? 'taller_facturas' : 'taller_presupuestos'
    const prefix = tipo === 'factura' ? 'FAC' : 'PRES'
    const number = `${prefix}-${Date.now().toString().slice(-6)}`
    const total = await pool.query('SELECT COALESCE(SUM(precio * cantidad), 0) AS total FROM taller_ingreso_items WHERE ingreso_id = $1', [req.params.id])
    const result = await pool.query(`INSERT INTO ${table} (numero, ingreso_id, total) VALUES ($1, $2, $3) RETURNING id, numero AS number, ingreso_id AS "entryId", estado AS status, total, created_at AS created`, [number, req.params.id, total.rows[0].total])
    res.status(201).json({ ...result.rows[0], total: Number(result.rows[0].total) })
  } catch { res.status(500).send(`Error al crear ${tipo}`) }
}

export const eliminarDocumento = tipo => async (req, res) => {
  try {
    const table = tipo === 'factura' ? 'taller_facturas' : 'taller_presupuestos'
    if (tipo === 'factura') {
      const current = await pool.query('SELECT estado FROM taller_facturas WHERE id = $1', [req.params.id])
      if (current.rows[0] && ['Pagada', 'Anulada'].includes(current.rows[0].estado)) return res.status(409).send('Una factura pagada o anulada no se puede eliminar')
    }
    const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id])
    if (!result.rows[0]) return res.status(404).send(`${tipo} no encontrado`)
    res.json({ deleted: true })
  } catch { res.status(500).send(`Error al eliminar ${tipo}`) }
}

export const actualizarFactura = async (req, res) => {
  try {
    const { status, total } = req.body
    const current = await pool.query('SELECT estado FROM taller_facturas WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).send('Factura no encontrada')
    if (['Pagada', 'Anulada'].includes(current.rows[0].estado)) return res.status(409).send('Una factura pagada o anulada no se puede modificar')
    const allowedStatuses = ['Pendiente de pago', 'Pagada', 'Anulada']
    if (status && !allowedStatuses.includes(status)) return res.status(400).send('Estado de factura no válido')
    const result = await pool.query(
      'UPDATE taller_facturas SET estado = COALESCE($1, estado), total = COALESCE($2, total) WHERE id = $3 RETURNING id, numero AS number, ingreso_id AS "entryId", estado AS status, total, created_at AS created',
      [status || null, total === undefined ? null : Math.max(0, Number(total) || 0), req.params.id]
    )
    res.json({ ...result.rows[0], total: Number(result.rows[0].total) })
  } catch { res.status(500).send('Error al actualizar factura') }
}

export const subirFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Debes adjuntar una imagen')
    const result = await pool.query('INSERT INTO taller_fotos (ingreso_id, nombre_original, nombre_archivo, ruta) VALUES ($1, $2, $3, $4) RETURNING id, ingreso_id AS "entryId", nombre_original AS "originalName", nombre_archivo AS "fileName", ruta AS path', [req.params.id, req.file.originalname, req.file.filename, `/uploads/ingresos/${req.file.filename}`])
    res.status(201).json(result.rows[0])
  } catch { res.status(500).send('Error al guardar la foto') }
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
      try { await handler(client, row); imported += 1 } catch (error) { errors.push({ fila: index + 2, motivo: error.message }) }
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