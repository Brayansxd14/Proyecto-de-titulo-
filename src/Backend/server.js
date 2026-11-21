import cors from 'cors'
import express from 'express'
import { readFile } from 'node:fs/promises'
import pool, { databaseConfigured } from './db.js'
import usuariosRoutes from './Rutas_Backend/usuariosRoutes.js'
import inventarioRoutes from './Rutas_Backend/inventarioRoutes.js'
import reporteRoutes from './Rutas_Backend/reporteRoutes.js'
import empleadosRoutes from './Rutas_Backend/empleadosRoutes.js'
import asistenciaRoutes from './Rutas_Backend/asistenciaRoutes.js' 
import adminRoutes from './Rutas_Backend/adminRoutes.js'
import rrhhRoutes from './Rutas_Backend/rrhhRoutes.js'
import proveedoresRoutes from './Rutas_Backend/proveedoresRoutes.js'
import tallerRoutes from './Rutas_Backend/tallerRoutes.js'
import facturacionRoutes from './Rutas_Backend/facturacionRoutes.js'
import { verificarToken } from './middlewares/auth.js'

const app = express()
app.use(express.json())
app.use(cors())

app.get('/api/health', async (_req, res) => {
  if (!databaseConfigured) {
    return res.status(503).json({
      api: 'ok',
      database: 'unavailable',
      errorCode: 'DATABASE_URL_MISSING'
    })
  }

  try {
    await pool.query('SELECT 1')
    res.json({ api: 'ok', database: 'connected' })
  } catch (error) {
    console.error(`Error en comprobación de salud de la base de datos (${error.code || 'UNKNOWN'})`)
    res.status(503).json({
      api: 'ok',
      database: 'unavailable',
      errorCode: error.code || 'UNKNOWN'
    })
  }
})

app.get('/', (req, res) => {
  res.send('✅ Servidor funcionando!')
})

app.use('/api', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/login') return next()
  return verificarToken(req, res, next)
})

app.get('/api/session', (req, res) => {
  res.json({ usuario: req.user })
})

// Rutas de usuarios
app.use('/api', usuariosRoutes)
app.use('/api', inventarioRoutes)
app.use('/api', reporteRoutes)
app.use('/api', empleadosRoutes)
app.use('/api', asistenciaRoutes)
app.use('/api', adminRoutes)
app.use('/api', rrhhRoutes)
app.use('/api', proveedoresRoutes)
app.use('/api', tallerRoutes)
app.use('/api', facturacionRoutes)
app.use('/uploads', express.static('uploads'))

const PORT = process.env.PORT || 3000

// 🚀 Arrancar servidor y verificar conexión a BD
app.listen(PORT, async () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)

  if (!databaseConfigured) {
    console.error('❌ DATABASE_URL no está configurada; define la URI de conexión PostgreSQL de Supabase.')
    return
  }

  try {
    await pool.query('SELECT 1')
    console.log('✅ Conexión a PostgreSQL establecida')
  } catch (err) {
    console.error(`❌ Error al conectar con PostgreSQL (${err.code || 'UNKNOWN'}). Revisa la configuración y disponibilidad de la base de datos.`)
    return
  }

  try {
    const rrhhSchema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
    await pool.query(rrhhSchema)
    await pool.query('ALTER TABLE empleados ADD COLUMN IF NOT EXISTS salario NUMERIC(12, 2)')
    await pool.query('SELECT NOW()')
    console.log('✅ Esquema de base de datos disponible')
  } catch (err) {
    console.error(`❌ Error al inicializar el esquema de PostgreSQL (${err.code || 'UNKNOWN'}). Revisa que las tablas base existan y que el usuario tenga permisos.`)
  }
})
