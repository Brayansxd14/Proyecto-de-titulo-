import pool from '../db.js'

// Obtener todos los repuestos
export const obtenerInventario = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventario ORDER BY nombre ASC')
    res.json(result.rows)
  } catch (err) {
    console.error("Error al obtener inventario:", err.message)
    res.status(500).send('Error al obtener inventario')
  }
}

// Obtener proveedores existentes para los selectores del inventario
export const obtenerProveedores = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT proveedor
       FROM inventario
       WHERE proveedor IS NOT NULL AND TRIM(proveedor) <> ''
       ORDER BY proveedor ASC`
    )
    res.json(result.rows.map(row => row.proveedor))
  } catch (err) {
    console.error('Error al obtener proveedores:', err.message)
    res.status(500).send('Error al obtener proveedores')
  }
}

// Obtener un repuesto por número de serie
export const obtenerRepuestoPorId = async (req, res) => {
  try {
    const { numero_serie } = req.params
    const result = await pool.query('SELECT * FROM inventario WHERE numero_serie = $1', [numero_serie])

    if (result.rows.length === 0) {
      return res.status(404).send('Repuesto no encontrado')
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error al obtener repuesto:", err.message)
    res.status(500).send('Error al obtener repuesto')
  }
}

// Buscar repuestos con varios filtros opcionales
export const buscarInventario = async (req, res) => {
  const { numero_serie, nombre, proveedor, tipo, estado, cantidadMin, cantidadMax } = req.query
  const condiciones = []
  const valores = []

  const agregarTexto = (columna, valor) => {
    if (valor?.trim()) {
      valores.push(`%${valor.trim()}%`)
      condiciones.push(`${columna} ILIKE $${valores.length}`)
    }
  }

  agregarTexto('numero_serie', numero_serie)
  agregarTexto('nombre', nombre)
  agregarTexto('proveedor', proveedor)
  agregarTexto('tipo', tipo)
  agregarTexto('estado', estado)

  if (cantidadMin !== undefined && cantidadMin !== '') {
    valores.push(Number(cantidadMin))
    condiciones.push(`cantidad >= $${valores.length}`)
  }

  if (cantidadMax !== undefined && cantidadMax !== '') {
    valores.push(Number(cantidadMax))
    condiciones.push(`cantidad <= $${valores.length}`)
  }

  try {
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''
    const result = await pool.query(`SELECT * FROM inventario ${where} ORDER BY nombre ASC`, valores)
    res.json(result.rows)
  } catch (err) {
    console.error('Error al buscar inventario:', err.message)
    res.status(400).send('Error al buscar inventario')
  }
}

// Crear repuesto
export const crearRepuesto = async (req, res) => {
  try {
    const { numero_serie, nombre, cantidad, precio, tipo, proveedor } = req.body

    const estado = cantidad > 0 ? 'con stock' : 'sin stock'

    const result = await pool.query(
      `INSERT INTO inventario (numero_serie, nombre, cantidad, precio, tipo, proveedor, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [numero_serie, nombre, cantidad, precio, tipo, proveedor, estado]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error al crear repuesto:", err.message)
    res.status(500).send('Error al crear repuesto')
  }
}

// Actualizar repuesto
export const actualizarRepuesto = async (req, res) => {
  try {
    const { numero_serie } = req.params
    const { nombre, cantidad, precio, tipo, proveedor } = req.body

    const estado = cantidad > 0 ? 'con stock' : 'sin stock'

    const result = await pool.query(
      `UPDATE inventario 
       SET nombre=$1, cantidad=$2, precio=$3, tipo=$4, proveedor=$5, estado=$6
       WHERE numero_serie=$7 RETURNING *`,
      [nombre, cantidad, precio, tipo, proveedor, estado, numero_serie]
    )

    if (result.rows.length === 0) {
      return res.status(404).send('Repuesto no encontrado')
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error al actualizar repuesto:", err.message)
    res.status(500).send('Error al actualizar repuesto')
  }
}

// Eliminar repuesto
export const eliminarRepuesto = async (req, res) => {
  try {
    const { numero_serie } = req.params
    const result = await pool.query('DELETE FROM inventario WHERE numero_serie=$1 RETURNING *', [numero_serie])

    if (result.rows.length === 0) {
      return res.status(404).send('Repuesto no encontrado')
    }

    res.json({ mensaje: 'Repuesto eliminado correctamente', repuesto: result.rows[0] })
  } catch (err) {
    console.error("Error al eliminar repuesto:", err.message)
    res.status(500).send('Error al eliminar repuesto')
  }
}
