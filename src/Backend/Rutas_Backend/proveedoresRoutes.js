import express from 'express'
import multer from 'multer'
import {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  importarProveedores,
  obtenerFacturasProveedor,
  registrarFacturaProveedor
} from '../Controladores/proveedoresController.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.get('/proveedores', obtenerProveedores)
router.post('/proveedores', crearProveedor)
router.put('/proveedores/:id', actualizarProveedor)
router.delete('/proveedores/:id', eliminarProveedor)
router.post('/proveedores/importar', upload.single('archivo'), importarProveedores)
router.get('/proveedores/facturas', obtenerFacturasProveedor)
router.post('/proveedores/facturas', registrarFacturaProveedor)

export default router
