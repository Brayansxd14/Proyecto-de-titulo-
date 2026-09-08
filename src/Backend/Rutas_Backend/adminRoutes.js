/* eslint-disable no-unused-vars */
import express from 'express'
import { verificarToken, soloAdmin } from '../middlewares/auth.js'
import pool from '../db.js'

const router = express.Router()

// 🔹 Ejemplo de ruta solo para admin
router.get('/admin/dashboard', verificarToken, soloAdmin, (req, res) => {
  res.json({ mensaje: 'Bienvenido al panel de administración' })
})

// 🔹 Otra ruta especial
router.delete('/admin/eliminar-usuario/:rut', verificarToken, soloAdmin, async (req, res) => {
  const { rut } = req.params
  try {
    await pool.query('DELETE FROM usuarios WHERE rut=$1', [rut])
    res.send(`Usuario con RUT ${rut} eliminado por admin`)
  } catch (err) {
    res.status(500).send('Error al eliminar usuario')
  }
})

export default router
