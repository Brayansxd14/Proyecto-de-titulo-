import express from 'express'
import { crearUsuario, obtenerUsuarios, obtenerUsuarioPorId, eliminarUsuario, loginUsuario } from '../Controladores/usuariosController.js'

const router = express.Router()

// CRUD usuarios
router.post('/usuarios', crearUsuario)
router.get('/usuarios', obtenerUsuarios)
router.get('/usuarios/:id', obtenerUsuarioPorId)
router.delete('/usuarios/:id', eliminarUsuario)

// 🔹 Login
router.post('/login', loginUsuario)

export default router 
