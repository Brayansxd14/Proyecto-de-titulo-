/* eslint-disable no-unused-vars */
import pool from '../db.js'

// Crear empleado
export const crearEmpleado = async (req, res) => {
  const { rut, cargo, telefono, fecha_ingreso, salario } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO empleados (rut, cargo, telefono, fecha_ingreso, salario) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [rut, cargo, telefono, fecha_ingreso, salario || null]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).send('Error al crear empleado')
  }
}

// Obtener todos los empleados
export const obtenerEmpleados = async (req, res) => {
  const { busqueda = '' } = req.query
  try {
    const result = await pool.query(
      `SELECT * FROM empleados
       WHERE rut ILIKE $1 OR cargo ILIKE $1
       ORDER BY rut`,
      [`%${busqueda}%`]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).send('Error al obtener empleados')
  }
}

// Actualizar datos de un empleado
export const actualizarEmpleado = async (req, res) => {
  const { rut } = req.params
  const { cargo, telefono, fecha_ingreso, salario } = req.body
  try {
    const result = await pool.query(
      `UPDATE empleados
       SET cargo = $1, telefono = $2, fecha_ingreso = $3, salario = $4
       WHERE rut = $5
       RETURNING *`,
      [cargo, telefono, fecha_ingreso, salario || null, rut]
    )

    if (result.rows.length === 0) return res.status(404).send('Empleado no encontrado')
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).send('Error al actualizar empleado')
  }
}

// Obtener empleado por RUT
export const obtenerEmpleadoPorRut = async (req, res) => {
  const { rut } = req.params
  try {
    const result = await pool.query('SELECT * FROM empleados WHERE rut=$1', [rut])
    if (result.rows.length === 0) return res.status(404).send('Empleado no encontrado')
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).send('Error al obtener empleado')
  }
}

// Eliminar empleado
export const eliminarEmpleado = async (req, res) => {
  const { rut } = req.params
  try {
    await pool.query('DELETE FROM empleados WHERE rut=$1', [rut])
    res.send('Empleado eliminado')
  } catch (err) {
    res.status(500).send('Error al eliminar empleado')
  }
}
