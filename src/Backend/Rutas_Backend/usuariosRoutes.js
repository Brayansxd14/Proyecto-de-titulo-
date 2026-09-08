import express from 'express'
import {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorRut,
  eliminarUsuario,
  loginUsuario
} from '../Controladores/usuariosController.js'

const router = express.Router()

// 🔹 CRUD usuarios
router.post('/usuarios', crearUsuario)
router.get('/usuarios', obtenerUsuarios)
router.get('/usuarios/:rut', obtenerUsuarioPorRut)  
router.delete('/usuarios/:rut', eliminarUsuario)     

// 🔹 Login
router.post('/login', loginUsuario)

export default router
