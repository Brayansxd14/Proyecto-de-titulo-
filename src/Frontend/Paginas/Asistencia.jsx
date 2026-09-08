// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { QRCodeSVG } from 'qrcode.react'
import '../styles/Asistencia.css'

const Asistencia = () => {
  const [asistencias, setAsistencias] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [empleadoQr, setEmpleadoQr] = useState('')
  const [form, setForm] = useState({
    empleado_rut: '',
    fecha: '',
    hora_entrada: '',
    hora_salida: '',
    estado: 'Presente'
  })

  // 🔹 Cargar reporte inicial
 useEffect(() => {
  const cargarEmpleados = async () => {
    try {
      const res = await api.get('/empleados')
      setEmpleados(res.data)
    } catch (err) {
      console.error('Error al cargar empleados:', err)
    }
  }

  const cargarReporte = async () => {
    try {
      const res = await api.get('/asistencia/reporte?fechaInicio=2026-09-01&fechaFin=2026-09-30')
      setAsistencias(res.data)
    } catch (err) {
      console.error('Error al cargar reporte:', err)
    }
  }

  cargarEmpleados()
  cargarReporte()
}, [])


  const cargarReporte = async () => {
    try {
      const res = await api.get('/asistencia/reporte?fechaInicio=2026-09-01&fechaFin=2026-09-30')
      setAsistencias(res.data)
    } catch (err) {
      console.error('Error al cargar reporte:', err)
    }
  }

  const registrarAsistencia = async () => {
    try {
      await api.post('/asistencia', form)
      setForm({ empleado_rut: '', fecha: '', hora_entrada: '', hora_salida: '', estado: 'Presente' })
      cargarReporte()
    } catch (err) {
      console.error('Error al registrar asistencia:', err)
    }
  }

  return (
    <div>
      <h2>Control de Asistencia</h2>

      <section className="asistencia-qr-panel">
        <div>
          <h3>Identificación rápida</h3>
          <p>Este QR identifica al empleado y no reemplaza ni duplica la marcación del reloj con tarjeta.</p>
          <select value={empleadoQr} onChange={e => setEmpleadoQr(e.target.value)}>
            <option value="">Selecciona un empleado</option>
            {empleados.map(empleado => (
              <option key={empleado.rut} value={empleado.rut}>
                {empleado.rut} - {empleado.cargo}
              </option>
            ))}
          </select>
        </div>
        {empleadoQr && (
          <div className="asistencia-qr-code">
            <QRCodeSVG value={`gestor-taller:empleado:${empleadoQr}`} size={150} includeMargin />
            <strong>{empleadoQr}</strong>
          </div>
        )}
      </section>

      {/* 🔹 Formulario */}
      <form onSubmit={e => { e.preventDefault(); registrarAsistencia() }}>
        <input
          placeholder="RUT empleado"
          value={form.empleado_rut}
          onChange={e => setForm({ ...form, empleado_rut: e.target.value })}
        />
        <input
          type="date"
          value={form.fecha}
          onChange={e => setForm({ ...form, fecha: e.target.value })}
        />
        <input
          type="time"
          value={form.hora_entrada}
          onChange={e => setForm({ ...form, hora_entrada: e.target.value })}
        />
        <input
          type="time"
          value={form.hora_salida}
          onChange={e => setForm({ ...form, hora_salida: e.target.value })}
        />
        <select
          value={form.estado}
          onChange={e => setForm({ ...form, estado: e.target.value })}
        >
          <option value="Presente">Presente</option>
          <option value="Ausente">Ausente</option>
          <option value="Justificado">Justificado</option>
        </select>
        <button type="submit">Registrar</button>
      </form>

      {/* 🔹 Reporte */}
      <h3>Reporte de asistencia</h3>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Días asistidos</th>
          </tr>
        </thead>
        <tbody>
          {asistencias.map((a, i) => (
            <tr key={i}>
              <td>{a.nombre}</td>
              <td>{a.cargo}</td>
              <td>{a.dias_asistidos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Asistencia
