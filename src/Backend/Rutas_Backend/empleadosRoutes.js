import express from 'express'
import {
  crearEmpleado,
  obtenerEmpleados,
  obtenerEmpleadoPorRut,
  actualizarEmpleado,
  eliminarEmpleado
} from '../Controladores/empleadosController.js'

const router = express.Router()

router.post('/empleados', crearEmpleado)
router.get('/empleados', obtenerEmpleados)
router.get('/empleados/:rut', obtenerEmpleadoPorRut)
router.put('/empleados/:rut', actualizarEmpleado)
router.delete('/empleados/:rut', eliminarEmpleado)

export default router
