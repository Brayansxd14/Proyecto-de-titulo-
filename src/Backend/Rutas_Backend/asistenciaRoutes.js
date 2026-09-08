import express from 'express'
import {
  registrarAsistencia,
  reporteAsistencia
} from '../Controladores/asistenciaController.js'

const router = express.Router()

router.post('/asistencia', registrarAsistencia)
router.get('/asistencia/reporte', reporteAsistencia)

export default router
