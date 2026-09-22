import express from 'express'
import multer from 'multer'
import { obtenerInventario, obtenerProveedores, obtenerRepuestoPorId, buscarInventario, crearRepuesto, actualizarRepuesto, eliminarRepuesto, importarInventario } from '../Controladores/inventarioController.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.get('/inventario', obtenerInventario)
router.get('/inventario/proveedores', obtenerProveedores)
router.get('/inventario/buscar', buscarInventario)
router.get('/inventario/:numero_serie', obtenerRepuestoPorId)
router.post('/inventario', crearRepuesto)
router.put('/inventario/:numero_serie', actualizarRepuesto)
router.delete('/inventario/:numero_serie', eliminarRepuesto)
router.post('/inventario/importar', upload.single('archivo'), importarInventario)

export default router
