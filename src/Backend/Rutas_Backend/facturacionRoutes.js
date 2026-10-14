import express from 'express'
import { crearFactura, obtenerFacturacion } from '../Controladores/facturacionController.js'

const router = express.Router()

router.get('/facturacion', obtenerFacturacion)
router.post('/facturacion/ordenes/:id/factura', crearFactura)

export default router