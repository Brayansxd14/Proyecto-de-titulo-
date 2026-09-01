/* eslint-disable no-undef */
import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import pool from './db.js'
import usuariosRoutes from './Rutas_Backend/usuariosRoutes.js'
import inventarioRoutes from './Rutas_Backend/inventarioRoutes.js'

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

const PORT = process.env.PORT || 3000

// 🚀 Arrancar servidor y verificar conexión a BD
app.listen(PORT, async () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)

  try {
    await pool.query('SELECT NOW()')
    console.log('✅ Conexión a PostgreSQL establecida correctamente')
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message)
  }
})
