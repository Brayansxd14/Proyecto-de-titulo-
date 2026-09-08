import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/reporte-salidas', async (req, res) => {
  const { fechaInicio, fechaFin, proveedor = '' } = req.query

  try {
    const tableResult = await pool.query("SELECT to_regclass('public.salidas_inventario') AS table_name")

    if (!tableResult.rows[0].table_name) {
      return res.json([])
    }

    const result = await pool.query(
      `SELECT s.repuesto,
              COALESCE(i.proveedor, 'Sin proveedor') AS proveedor,
              SUM(s.cantidad) AS total_salidas
       FROM salidas_inventario s
       LEFT JOIN inventario i ON i.nombre = s.repuesto
       WHERE s.fecha_salida BETWEEN $1 AND $2
         AND ($3 = '' OR i.proveedor ILIKE $3)
       GROUP BY s.repuesto, i.proveedor
       ORDER BY total_salidas DESC`,
      [fechaInicio, fechaFin, proveedor.trim() ? `%${proveedor.trim()}%` : '']
    )

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

