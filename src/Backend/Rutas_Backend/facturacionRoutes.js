import express from 'express'
import {
  anularFactura,
  crearFactura,
  obtenerEstadoIntegracionSii,
  obtenerFactura,
  obtenerFacturacion,
  registrarPagoFactura
} from '../Controladores/facturacionController.js'

const router = express.Router()

router.get('/facturacion/sii/estado', obtenerEstadoIntegracionSii)
router.get('/facturacion', obtenerFacturacion)
router.get('/facturacion/:id', obtenerFactura)
router.post('/facturacion/ordenes/:id/factura', crearFactura)
router.post('/facturacion/:id/pagos', registrarPagoFactura)
router.patch('/facturacion/:id/anular', anularFactura)

export default router