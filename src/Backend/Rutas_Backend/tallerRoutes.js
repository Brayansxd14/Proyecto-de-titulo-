import express from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { agregarItem, actualizarIngreso, actualizarItem, crearCliente, crearDocumento, crearIngreso, crearManoObra, crearVehiculo, eliminarDocumento, eliminarItem, importarClientes, importarVehiculos, obtenerTaller, prepararCarpetaFotos, subirFoto } from '../Controladores/tallerController.js'

const router = express.Router()
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, path.resolve('uploads/ingresos')),
  filename: (_req, file, callback) => callback(null, `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
})
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(
    file.mimetype.startsWith('image/') ? null : new Error('Solo se aceptan imágenes'),
    file.mimetype.startsWith('image/')
  )
})
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
router.post('/taller/ingresos/:id/fotos', (req, res, next) => {
  upload.single('foto')(req, res, error => {
    if (!error) return next()
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    res.status(status).json({
      error: error.code === 'LIMIT_FILE_SIZE'
        ? 'La foto supera el límite de 8 MB'
        : 'Solo se aceptan imágenes'
    })
  })
}, subirFoto)

export default router