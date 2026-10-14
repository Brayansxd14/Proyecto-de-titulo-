import express from 'express'
import multer from 'multer'
import path from 'node:path'
import { agregarItem, actualizarFactura, actualizarIngreso, actualizarItem, crearCliente, crearDocumento, crearIngreso, crearManoObra, crearVehiculo, eliminarDocumento, eliminarItem, importarClientes, importarVehiculos, obtenerTaller, prepararCarpetaFotos, subirFoto } from '../Controladores/tallerController.js'
import { crearFactura } from '../Controladores/facturacionController.js'

const router = express.Router()
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, path.resolve('uploads/ingresos')),
  filename: (_req, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
})
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith('image/')) })
const spreadsheetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
await prepararCarpetaFotos()

router.get('/taller', obtenerTaller)
router.post('/taller/clientes', crearCliente)
router.post('/taller/vehiculos', crearVehiculo)
router.post('/taller/clientes/importar', spreadsheetUpload.single('archivo'), importarClientes)
router.post('/taller/vehiculos/importar', spreadsheetUpload.single('archivo'), importarVehiculos)
router.post('/taller/mano-obra', crearManoObra)
router.post('/taller/ingresos', crearIngreso)
router.patch('/taller/ingresos/:id', actualizarIngreso)
router.post('/taller/ingresos/:id/items', agregarItem)
router.patch('/taller/ingresos/:id/items/:itemId', actualizarItem)
router.delete('/taller/ingresos/:id/items/:itemId', eliminarItem)
router.post('/taller/ingresos/:id/presupuesto', crearDocumento('presupuesto'))
router.delete('/taller/presupuestos/:id', eliminarDocumento('presupuesto'))
router.post('/taller/ingresos/:id/factura', crearFactura)
router.patch('/taller/facturas/:id', actualizarFactura)
router.delete('/taller/facturas/:id', eliminarDocumento('factura'))
router.post('/taller/ingresos/:id/fotos', upload.single('foto'), subirFoto)

export default router