import express from 'express'
import { obtenerInventario, obtenerRepuestoPorId, crearRepuesto, actualizarRepuesto, eliminarRepuesto } from '../Controladores/inventarioController.js'

const router = express.Router()

router.get('/inventario', obtenerInventario)
router.get('/inventario/:numero_serie', obtenerRepuestoPorId)
router.post('/inventario', crearRepuesto)
router.put('/inventario/:numero_serie', actualizarRepuesto)
router.delete('/inventario/:numero_serie', eliminarRepuesto)

export default router
