/* eslint-disable no-unused-vars */
import pool from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const rolesPermitidos = ['admin','mecanico', 'oficina', 'bodega', 'pintura']
const SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura'


// Crear usuario
export const crearUsuario = async (req, res) => {
  const { rut, nombre, email, rol, tipo_usuario, estado, password, cargo, telefono } = req.body
  try {
    // Validar campos obligatorios
    if (!rut || !nombre || !email || !rol || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: rut, nombre, email, rol, password' })
    }

    if (!rolesPermitidos.includes(rol.toLowerCase())) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    // Validar admin único
    if (rol.toLowerCase() === 'admin') {
      const checkAdmin = await pool.query('SELECT * FROM usuarios WHERE rol = $1', ['admin'])
      if (checkAdmin.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe un usuario administrador único' })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Insertar en usuarios (ahora incluye estado)
    const result = await pool.query(
      'INSERT INTO usuarios (rut, nombre, email, rol, tipo_usuario, estado, password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [rut, nombre, email, rol, tipo_usuario || 'general', estado || 'activo', hashedPassword]
    )

    // Si es empleado, insertar también en empleados
    if (tipo_usuario && tipo_usuario.toLowerCase() === 'empleado') {
      await pool.query(
        'INSERT INTO empleados (rut, cargo, telefono, fecha_ingreso) VALUES ($1, $2, $3, CURRENT_DATE)',
        [rut, cargo || null, telefono || null]
      )
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Error en crearUsuario:', err)
    res.status(500).json({ error: 'Error interno al crear usuario' })
  }
}




// Obtener todos los usuarios
export const obtenerUsuarios = async (req, res) => {
  try {
    const result = await pool.query('SELECT rut, nombre, email, rol, estado FROM usuarios')
    res.json(result.rows)
  } catch (err) {
    res.status(500).send('Error al obtener usuarios')
  }
}

// Obtener usuario por RUT
export const obtenerUsuarioPorRut = async (req, res) => {
  const { rut } = req.params
  try {
    const result = await pool.query(
      'SELECT rut, nombre, email, rol, estado FROM usuarios WHERE rut = $1',
      [rut]
    )
    if (result.rows.length === 0) return res.status(404).send('Usuario no encontrado')
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).send('Error al obtener usuario')
  }
}

// Eliminar usuario
export const eliminarUsuario = async (req, res) => {
  const { rut } = req.params
  try {
    await pool.query('DELETE FROM usuarios WHERE rut = $1', [rut])
    res.send('Usuario eliminado')
  } catch (err) {
    res.status(500).send('Error al eliminar usuario')
  }
}

// Login de usuario
export const loginUsuario = async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    if (result.rows.length === 0) return res.status(404).send('Usuario no encontrado')

    const usuario = result.rows[0]
    const valido = await bcrypt.compare(password, usuario.password)
    if (!valido) return res.status(401).send('Contraseña incorrecta')

    const token = jwt.sign(
      { rut: usuario.rut, rol: usuario.rol },
      SECRET,
      { expiresIn: '1h' }
    )

    res.json({ token, usuario: { rut: usuario.rut, nombre: usuario.nombre, rol: usuario.rol } })
  } catch (err) {
    res.status(500).send('Error en el login')
  }
}

