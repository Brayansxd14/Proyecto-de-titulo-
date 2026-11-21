import express from 'express'
import multer from 'multer'
import {
  crearEmpleado,
  obtenerEmpleados,
  obtenerEmpleadoPorRut,
  actualizarEmpleado,
  eliminarEmpleado,
  importarEmpleados,
  exportarEmpleados
} from '../Controladores/empleadosController.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.post('/empleados/importar', upload.single('archivo'), importarEmpleados)
router.get('/empleados/exportar', exportarEmpleados)
router.post('/empleados', crearEmpleado)
router.get('/empleados', obtenerEmpleados)
router.get('/empleados/:rut', obtenerEmpleadoPorRut)
router.put('/empleados/:rut', actualizarEmpleado)
router.delete('/empleados/:rut', eliminarEmpleado)

export default router
