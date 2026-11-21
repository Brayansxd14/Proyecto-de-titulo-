import express from 'express'
import multer from 'multer'
import { soloAdmin } from '../middlewares/auth.js'
import {
  crearUsuario,
  importarUsuarios,
  obtenerUsuarios,
  exportarUsuarios,
  obtenerUsuarioPorRut,
  eliminarUsuario,
  loginUsuario
} from '../Controladores/usuariosController.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// 🔹 CRUD usuarios
router.post('/usuarios/importar', soloAdmin, upload.single('archivo'), importarUsuarios)
router.post('/usuarios', soloAdmin, crearUsuario)
router.get('/usuarios/exportar', soloAdmin, exportarUsuarios)
router.get('/usuarios', soloAdmin, obtenerUsuarios)
router.get('/usuarios/:rut', soloAdmin, obtenerUsuarioPorRut)
router.delete('/usuarios/:rut', soloAdmin, eliminarUsuario)

// 🔹 Login
router.post('/login', loginUsuario)

export default router
