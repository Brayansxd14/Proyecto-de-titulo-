/* eslint-disable no-undef */
import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import { readFile } from 'node:fs/promises'
import pool from './db.js'
import usuariosRoutes from './Rutas_Backend/usuariosRoutes.js'
import inventarioRoutes from './Rutas_Backend/inventarioRoutes.js'
import reporteRoutes from './Rutas_Backend/reporteRoutes.js'
import empleadosRoutes from './Rutas_Backend/empleadosRoutes.js'
import asistenciaRoutes from './Rutas_Backend/asistenciaRoutes.js' 
import adminRoutes from './Rutas_Backend/adminRoutes.js'
import rrhhRoutes from './Rutas_Backend/rrhhRoutes.js'


dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('✅ Servidor funcionando!')
})

// Rutas de usuarios
app.use('/api', usuariosRoutes)
app.use('/api', inventarioRoutes)
app.use('/api', reporteRoutes)
app.use('/api', empleadosRoutes)
app.use('/api', asistenciaRoutes)
app.use('/api', adminRoutes)
app.use('/api', rrhhRoutes)

const PORT = process.env.PORT || 3000

// 🚀 Arrancar servidor y verificar conexión a BD
app.listen(PORT, async () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)

  try {
    await pool.query('ALTER TABLE empleados ADD COLUMN IF NOT EXISTS salario NUMERIC(12, 2)')
    const rrhhSchema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
    await pool.query(rrhhSchema)
    await pool.query('SELECT NOW()')
    console.log('✅ Conexión a PostgreSQL establecida y esquema de RRHH disponible')
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message)
  }
})
