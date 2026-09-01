/* eslint-disable no-unused-vars */
import pool from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const rolesPermitidos = ['mecanico', 'oficina', 'bodega', 'pintura']
const SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura'

// Crear usuario
export const crearUsuario = async (req, res) => {
  const { nombre, email, rol, password } = req.body
  try {
    // Validar rol
    if (!rolesPermitidos.includes(rol.toLowerCase())) {
      return res.status(400).send('Rol inválido. Debe ser mecánico, oficina, bodega o pintura')
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, rol, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, email, rol, hashedPassword]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).send('Error al crear usuario')
  }
}

// Obtener todos los usuarios
export const obtenerUsuarios = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, rol, estado FROM usuarios')
    res.json(result.rows)
  } catch (err) {
    console.error("Error al obtener usuarios:", err)
    res.status(500).send('Error al obtener usuarios')
  }
}

// Obtener usuario por ID
export const obtenerUsuarioPorId = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) return res.status(404).send('Usuario no encontrado')
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).send('Error al obtener usuario')
  }
}

// Eliminar usuario
export const eliminarUsuario = async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id])
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

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      SECRET,
      { expiresIn: '1h' }
    )

    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } })
  } catch (err) {
    res.status(500).send('Error en el login')
  }
}
