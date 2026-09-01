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

// Crear repuesto
export const crearRepuesto = async (req, res) => {
  try {
    const { numero_serie, nombre, cantidad, precio, tipo, proveedor,} = req.body

    // Estado automático según cantidad
    const estado = cantidad > 0 ? 'con stock' : 'sin stock'

    const result = await pool.query(
      `INSERT INTO inventario (numero_serie, nombre, cantidad, precio, tipo, proveedor, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [numero_serie, nombre, cantidad, precio, tipo, proveedor,  estado]
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
    const { nombre, cantidad, precio, tipo, proveedor, } = req.body

    const estado = cantidad > 0 ? 'con stock' : 'sin stock'

    const result = await pool.query(
  `UPDATE inventario 
   SET nombre=$1, cantidad=$2, precio=$3, tipo=$4, proveedor=$5, estado=$7
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
