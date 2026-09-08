/* eslint-disable no-unused-vars */
import pool from '../db.js'

// Registrar asistencia
export const registrarAsistencia = async (req, res) => {
  const { empleado_rut, fecha, hora_entrada, hora_salida, estado } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO asistencia (empleado_rut, fecha, hora_entrada, hora_salida, estado) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [empleado_rut, fecha, hora_entrada, hora_salida, estado]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).send('Error al registrar asistencia')
  }
}

// Reporte de asistencia por rango de fechas
export const reporteAsistencia = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query
  try {
    const result = await pool.query(
      `SELECT u.nombre, e.cargo, COUNT(a.id) AS dias_asistidos
       FROM asistencia a
       JOIN empleados e ON a.empleado_rut = e.rut
       JOIN usuarios u ON e.rut = u.rut
       WHERE a.fecha BETWEEN $1 AND $2 AND a.estado = 'Presente'
       GROUP BY u.nombre, e.cargo`,
      [fechaInicio, fechaFin]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).send('Error al generar reporte')
  }
}
