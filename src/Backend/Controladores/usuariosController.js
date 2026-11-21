/* eslint-disable no-unused-vars */
import pool, { databaseConfigured } from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import XLSX from 'xlsx'
import { readSpreadsheet, valueFrom } from '../utils/spreadsheet.js'

const rolesPermitidos = ['admin','mecanico', 'oficina', 'bodega', 'pintura']
const tiposPermitidos = ['empleado', 'cliente', 'proveedor', 'general']


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
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      if (rol.toLowerCase() === 'admin') {
        const checkAdmin = await client.query('SELECT * FROM usuarios WHERE rol = $1', ['admin'])
        if (checkAdmin.rows.length > 0) {
          await client.query('ROLLBACK')
          return res.status(400).json({ error: 'Ya existe un usuario administrador único' })
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const esEmpleado = tipo_usuario?.toLowerCase() === 'empleado'

      if (esEmpleado) {
        await client.query(
          `INSERT INTO empleados (rut, cargo, telefono, fecha_ingreso)
           VALUES ($1, $2, $3, CURRENT_DATE)
           ON CONFLICT (rut) DO NOTHING`,
          [rut, cargo || null, telefono || null]
        )
      }

      const result = await client.query(
        `INSERT INTO usuarios
          (rut, nombre, email, rol, tipo_usuario, estado, password)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING rut, nombre, email, rol, tipo_usuario, estado`,
        [rut, nombre, email, rol, tipo_usuario || 'general', estado || 'activo', hashedPassword]
      )

      await client.query('COMMIT')
      res.json(result.rows[0])
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Error en crearUsuario:', err)
    res.status(500).json({ error: 'Error interno al crear usuario' })
  }
}

export const importarUsuarios = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Selecciona un archivo Excel o CSV' })

  let rows
  try {
    rows = readSpreadsheet(req.file.buffer)
  } catch {
    return res.status(400).json({ message: 'No se pudo leer el archivo. Verifica que sea un Excel o CSV válido.' })
  }

  if (!rows.length) return res.status(400).json({ message: 'El archivo no contiene filas de datos' })

  const errors = []
  const rutsEnArchivo = new Set()
  const correosEnArchivo = new Set()
  let imported = 0
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [1346454349])

    for (const [index, row] of rows.entries()) {
      const rut = String(valueFrom(row, ['rut']) ?? '').trim()
      const nombre = String(valueFrom(row, ['nombre']) ?? '').trim()
      const email = String(valueFrom(row, ['correo', 'email']) ?? '').trim().toLowerCase()
      const rol = String(valueFrom(row, ['rol']) ?? '').trim().toLowerCase()
      const password = String(valueFrom(row, ['contrasena', 'password', 'clave']) ?? '')
      const tipoUsuario = String(valueFrom(row, ['tipousuario', 'tipodeusuario', 'tipo']) ?? 'general').trim().toLowerCase() || 'general'
      const estado = String(valueFrom(row, ['estado']) ?? 'activo').trim() || 'activo'
      const cargo = String(valueFrom(row, ['cargo']) ?? '').trim() || null
      const telefono = String(valueFrom(row, ['telefono', 'celular']) ?? '').trim() || null
      const fila = index + 2

      if (!rut || !nombre || !email || !rol || !password.trim()) {
        errors.push({ fila, motivo: 'RUT, Nombre, Correo, Rol y Contraseña son obligatorios' })
        continue
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ fila, motivo: 'El correo no tiene un formato válido' })
        continue
      }
      if (!rolesPermitidos.includes(rol)) {
        errors.push({ fila, motivo: 'Rol inválido' })
        continue
      }
      if (!tiposPermitidos.includes(tipoUsuario)) {
        errors.push({ fila, motivo: 'Tipo de usuario inválido' })
        continue
      }
      if (Buffer.byteLength(password, 'utf8') > 72) {
        errors.push({ fila, motivo: 'La contraseña supera el máximo permitido de 72 bytes' })
        continue
      }

      const rutNormalizado = rut.toUpperCase()
      if (rutsEnArchivo.has(rutNormalizado)) {
        errors.push({ fila, motivo: 'El RUT está repetido en el archivo' })
        continue
      }
      if (correosEnArchivo.has(email)) {
        errors.push({ fila, motivo: 'El correo está repetido en el archivo' })
        continue
      }
      rutsEnArchivo.add(rutNormalizado)
      correosEnArchivo.add(email)

      await client.query('SAVEPOINT importar_usuario')
      try {
        const duplicate = await client.query(
          `SELECT 1 FROM usuarios
           WHERE LOWER(BTRIM(rut)) = LOWER(BTRIM($1))
              OR LOWER(email) = $2
           LIMIT 1`,
          [rut, email]
        )
        if (duplicate.rowCount) {
          errors.push({ fila, motivo: 'Ya existe una cuenta con ese RUT o correo' })
          await client.query('ROLLBACK TO SAVEPOINT importar_usuario')
          await client.query('RELEASE SAVEPOINT importar_usuario')
          continue
        }

        if (rol === 'admin') {
          const existingAdmin = await client.query(
            `SELECT 1 FROM usuarios WHERE LOWER(BTRIM(rol)) = 'admin' LIMIT 1`
          )
          if (existingAdmin.rowCount) {
            errors.push({ fila, motivo: 'Ya existe una cuenta administradora' })
            await client.query('ROLLBACK TO SAVEPOINT importar_usuario')
            await client.query('RELEASE SAVEPOINT importar_usuario')
            continue
          }
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await client.query(
          `INSERT INTO usuarios (rut, nombre, email, rol, tipo_usuario, estado, password)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [rut, nombre, email, rol, tipoUsuario, estado, hashedPassword]
        )

        if (tipoUsuario === 'empleado') {
          await client.query(
            `INSERT INTO empleados (rut, cargo, telefono, fecha_ingreso)
             VALUES ($1, $2, $3, CURRENT_DATE)
             ON CONFLICT (rut) DO NOTHING`,
            [rut, cargo, telefono]
          )
        }

        await client.query('RELEASE SAVEPOINT importar_usuario')
        imported += 1
      } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT importar_usuario')
        await client.query('RELEASE SAVEPOINT importar_usuario')
        if (error.code === '23505') {
          errors.push({ fila, motivo: 'Ya existe una cuenta con ese RUT o correo' })
          continue
        }
        throw error
      }
    }

    await client.query('COMMIT')
    res.json({ imported, rejected: errors.length, errors })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error al importar usuarios:', error.message)
    res.status(500).json({ message: 'No se pudo importar el archivo de usuarios' })
  } finally {
    client.release()
  }
}



// Obtener todos los usuarios
export const obtenerUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.rut, u.nombre, u.email, u.rol, u.tipo_usuario, u.estado,
              e.cargo, e.telefono
       FROM usuarios u
       LEFT JOIN empleados e ON e.rut = u.rut`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).send('Error al obtener usuarios')
  }
}

export const exportarUsuarios = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.rut, u.nombre, u.email, u.rol, u.tipo_usuario, u.estado,
              e.cargo, e.telefono
       FROM usuarios u
       LEFT JOIN empleados e ON e.rut = u.rut
       ORDER BY u.rut`
    )
    const rows = result.rows.map((usuario) => ({
      RUT: usuario.rut,
      Nombre: usuario.nombre,
      Correo: usuario.email,
      Rol: usuario.rol,
      'Tipo de usuario': usuario.tipo_usuario || '',
      Estado: usuario.estado || '',
      Cargo: usuario.cargo || '',
      Teléfono: usuario.telefono || ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['RUT', 'Nombre', 'Correo', 'Rol', 'Tipo de usuario', 'Estado', 'Cargo', 'Teléfono']
    })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios')
    const file = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="usuarios.xlsx"')
    res.send(file)
  } catch (error) {
    console.error('Error al exportar usuarios:', error.message)
    res.status(500).json({ message: 'No se pudo exportar la lista de usuarios' })
  }
}

// Obtener usuario por RUT
export const obtenerUsuarioPorRut = async (req, res) => {
  const { rut } = req.params
  try {
    const result = await pool.query(
      `SELECT u.rut, u.nombre, u.email, u.rol, u.tipo_usuario, u.estado,
              e.cargo, e.telefono
       FROM usuarios u
       LEFT JOIN empleados e ON e.rut = u.rut
       WHERE u.rut = $1`,
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
  const email = req.body.email?.trim().toLowerCase()
  const { password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' })
  }

  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: 'Autenticación no configurada: define JWT_SECRET con al menos 32 caracteres' })
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = $1', [email])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })

    const usuario = result.rows[0]
    const valido = await bcrypt.compare(password, usuario.password)
    if (!valido) return res.status(401).json({ error: 'Contraseña incorrecta' })

    const token = jwt.sign(
      { rut: usuario.rut, rol: usuario.rol },
      secret,
      { expiresIn: '1h' }
    )

    res.json({ token, usuario: { rut: usuario.rut, nombre: usuario.nombre, rol: usuario.rol } })
  } catch (err) {
    console.error('Error en el login:', err)
    if (!databaseConfigured) {
      return res.status(503).json({
        error: 'Falta DATABASE_URL: configura la URI de conexión PostgreSQL de Supabase en el .env del backend.'
      })
    }

    const databaseUnavailable = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      '08000',
      '08001',
      '08003',
      '08006',
      '28P01',
      '3D000'
    ].includes(err.code)

    res.status(databaseUnavailable ? 503 : 500).json({
      error: databaseUnavailable
        ? 'No se puede acceder a la base de datos. Verifica PostgreSQL y DATABASE_URL.'
        : 'Error interno en el inicio de sesión'
    })
  }
}
