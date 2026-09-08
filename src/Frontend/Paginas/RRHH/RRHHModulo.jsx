import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../services/api'
import './RRHH.css'

const configuracion = {
  vacaciones: { titulo: 'Vacaciones', descripcion: 'Períodos de vacaciones registrados por empleado.', columnas: [['empleado_rut', 'Empleado'], ['cargo', 'Cargo'], ['fecha_inicio', 'Desde'], ['fecha_fin', 'Hasta'], ['dias', 'Días'], ['estado', 'Estado']] },
  permisos: { titulo: 'Control de permisos', descripcion: 'Solicitudes y permisos registrados por empleado.', columnas: [['empleado_rut', 'Empleado'], ['cargo', 'Cargo'], ['tipo', 'Tipo'], ['fecha_inicio', 'Desde'], ['fecha_fin', 'Hasta'], ['estado', 'Estado']] },
  bonos: { titulo: 'Bonos asignados', descripcion: 'Bonos asociados a empleados y períodos de pago.', columnas: [['empleado_rut', 'Empleado'], ['cargo', 'Cargo'], ['tipo', 'Tipo'], ['monto', 'Monto'], ['periodo', 'Período'], ['estado', 'Estado']] },
  salarios: { titulo: 'Salarios', descripcion: 'Historial de salarios y fechas de vigencia.', columnas: [['empleado_rut', 'Empleado'], ['cargo', 'Cargo'], ['monto', 'Monto'], ['fecha_vigencia', 'Vigencia'], ['tipo', 'Tipo']] },
  liquidaciones: { titulo: 'Liquidación de sueldo', descripcion: 'Liquidaciones registradas por empleado y período.', columnas: [['empleado_rut', 'Empleado'], ['cargo', 'Cargo'], ['periodo', 'Período'], ['sueldo_base', 'Sueldo base'], ['bonos_total', 'Bonos'], ['descuentos', 'Descuentos'], ['total_liquido', 'Total líquido'], ['estado', 'Estado']] }
}

const RRHHModulo = () => {
  const { modulo } = useParams()
  const moduloActual = configuracion[modulo]
  const [registros, setRegistros] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [alcanceBono, setAlcanceBono] = useState('individual')
  const [form, setForm] = useState({ empleado_rut: '', tipo: '', fecha_inicio: '', fecha_fin: '', dias: '', motivo: '', observacion: '', monto: '', periodo: '', descripcion: '', fecha_vigencia: '', sueldo_base: '', bonos_total: '', descuentos: '', fecha_generacion: '' })

  useEffect(() => {
    const cargar = async () => {
      if (!moduloActual) return
      setCargando(true)
      setError('')
      try {
        const [registrosRes, empleadosRes] = await Promise.all([api.get(`/rrhh/${modulo}`), api.get('/empleados')])
        setRegistros(registrosRes.data)
        setEmpleados(empleadosRes.data)
      } catch (err) {
        console.error(`Error al cargar ${modulo}:`, err)
        setError('No se pudieron cargar los registros de este módulo.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [modulo, moduloActual])

  if (!moduloActual) return <section className="rrhh-module-page"><Link className="rrhh-back-link" to="/rrhh">← Volver a Recursos Humanos</Link><h2>Módulo no encontrado</h2></section>

  const actualizarCampo = e => setForm({ ...form, [e.target.name]: e.target.value })
  const mostrarValor = valor => valor === null || valor === undefined || valor === '' ? '-' : typeof valor === 'string' && valor.includes('T') ? valor.slice(0, 10) : valor
  const recargar = async () => setRegistros((await api.get(`/rrhh/${modulo}`)).data)

  const guardarRegistro = async e => {
    e.preventDefault()
    setEnviando(true)
    setMensaje('')
    setError('')
    try {
      let endpoint = `/rrhh/${modulo}`
      let datos = form
      if (modulo === 'bonos' && alcanceBono === 'todos') {
        endpoint = '/rrhh/bonos/masivo'
        datos = { ...form, empleado_rut: undefined }
      }
      await api.post(endpoint, datos)
      await recargar()
      setMensaje(modulo === 'bonos' && alcanceBono === 'todos' ? 'Bono asignado a todos los empleados.' : 'Registro guardado correctamente.')
      setForm({ empleado_rut: '', tipo: '', fecha_inicio: '', fecha_fin: '', dias: '', motivo: '', observacion: '', monto: '', periodo: '', descripcion: '', fecha_vigencia: '', sueldo_base: '', bonos_total: '', descuentos: '', fecha_generacion: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el registro.')
    } finally {
      setEnviando(false)
    }
  }

  const renderFormulario = () => {
    if (!['vacaciones', 'permisos', 'bonos', 'salarios', 'liquidaciones'].includes(modulo)) return null
    return <form className="rrhh-data-form" onSubmit={guardarRegistro}>
      <h3>Agregar registro</h3>
      {modulo === 'bonos' && <div className="rrhh-bono-mode"><label><input type="radio" checked={alcanceBono === 'individual'} onChange={() => setAlcanceBono('individual')} /> Bono individual</label><label><input type="radio" checked={alcanceBono === 'todos'} onChange={() => setAlcanceBono('todos')} /> Bono para todos</label></div>}
      {!(modulo === 'bonos' && alcanceBono === 'todos') && <select name="empleado_rut" value={form.empleado_rut} onChange={actualizarCampo} required><option value="">Selecciona un empleado</option>{empleados.map(empleado => <option key={empleado.rut} value={empleado.rut}>{empleado.rut} - {empleado.cargo}</option>)}</select>}
      {modulo === 'vacaciones' && <><input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={actualizarCampo} required /><input name="fecha_fin" type="date" value={form.fecha_fin} onChange={actualizarCampo} required /><input name="dias" type="number" min="0.5" step="0.5" placeholder="Días" value={form.dias} onChange={actualizarCampo} required /><input name="observacion" placeholder="Observación" value={form.observacion} onChange={actualizarCampo} /></>}
      {(modulo === 'permisos' || modulo === 'bonos') && <input name="tipo" placeholder={modulo === 'bonos' ? 'Tipo de bono' : 'Tipo de permiso'} value={form.tipo} onChange={actualizarCampo} required />}
      {modulo === 'permisos' && <><input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={actualizarCampo} required /><input name="fecha_fin" type="date" value={form.fecha_fin} onChange={actualizarCampo} required /><input name="motivo" placeholder="Motivo" value={form.motivo} onChange={actualizarCampo} /></>}
      {modulo === 'bonos' && <><input name="monto" type="number" min="0" step="0.01" placeholder="Monto" value={form.monto} onChange={actualizarCampo} required /><input name="periodo" type="date" value={form.periodo} onChange={actualizarCampo} required /><input name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={actualizarCampo} /></>}
      {modulo === 'salarios' && <><input name="monto" type="number" min="0" step="0.01" placeholder="Monto del salario" value={form.monto} onChange={actualizarCampo} required /><input name="fecha_vigencia" type="date" value={form.fecha_vigencia} onChange={actualizarCampo} required /><select name="tipo" value={form.tipo} onChange={actualizarCampo}><option value="Base">Base</option><option value="Hora">Hora</option><option value="Otro">Otro</option></select><input name="observacion" placeholder="Observación" value={form.observacion} onChange={actualizarCampo} /></>}
      {modulo === 'liquidaciones' && <><input name="periodo" type="date" value={form.periodo} onChange={actualizarCampo} required /><input name="sueldo_base" type="number" min="0" step="0.01" placeholder="Sueldo base" value={form.sueldo_base} onChange={actualizarCampo} required /><input name="bonos_total" type="number" min="0" step="0.01" placeholder="Bonos" value={form.bonos_total} onChange={actualizarCampo} /><input name="descuentos" type="number" min="0" step="0.01" placeholder="Descuentos" value={form.descuentos} onChange={actualizarCampo} /><input name="fecha_generacion" type="date" value={form.fecha_generacion} onChange={actualizarCampo} /></>}
      <button type="submit" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar'}</button>
    </form>
  }

  return <section className="rrhh-module-page">
    <Link className="rrhh-back-link" to="/rrhh">← Volver a Recursos Humanos</Link>
    <p className="rrhh-eyebrow">Recursos Humanos</p>
    <h2>{moduloActual.titulo}</h2>
    <p>{moduloActual.descripcion}</p>
    {renderFormulario()}
    {mensaje && <p className="rrhh-table-status rrhh-table-success">{mensaje}</p>}
    {cargando && <p className="rrhh-table-status">Cargando registros...</p>}
    {error && <p className="rrhh-table-status rrhh-table-error">{error}</p>}
    {!cargando && !error && registros.length === 0 && <div className="rrhh-empty-state"><span aria-hidden="true">◌</span><strong>Aún no hay registros</strong><small>La tabla está lista. Cuando se agreguen datos, aparecerán aquí.</small></div>}
    {!cargando && !error && registros.length > 0 && <div className="rrhh-table-wrapper"><table><thead><tr>{moduloActual.columnas.map(([, etiqueta]) => <th key={etiqueta}>{etiqueta}</th>)}</tr></thead><tbody>{registros.map((registro, indice) => <tr key={registro.id || indice}>{moduloActual.columnas.map(([campo]) => <td key={campo}>{mostrarValor(registro[campo])}</td>)}</tr>)}</tbody></table></div>}
  </section>
}

export default RRHHModulo
