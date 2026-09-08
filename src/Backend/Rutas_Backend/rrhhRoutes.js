import express from 'express'
import {
	obtenerModuloRrhh,
	crearVacacion,
	crearPermiso,
	crearBono,
	crearBonosParaTodos,
	crearSalario,
	crearLiquidacion
} from '../Controladores/rrhhController.js'

const router = express.Router()

router.post('/rrhh/permisos', crearPermiso)
router.post('/rrhh/vacaciones', crearVacacion)
router.post('/rrhh/bonos/masivo', crearBonosParaTodos)
router.post('/rrhh/bonos', crearBono)
router.post('/rrhh/salarios', crearSalario)
router.post('/rrhh/liquidaciones', crearLiquidacion)
router.get('/rrhh/:modulo', obtenerModuloRrhh)

export default router
