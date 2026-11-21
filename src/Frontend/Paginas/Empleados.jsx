/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import api from '../services/api'
import '../styles/Empleados.css'

const Empleados = () => {
  const [empleados, setEmpleados] = useState([])
  const [form, setForm] = useState({ rut: '', cargo: '', telefono: '', fecha_ingreso: '', salario: '' })
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [importando, setImportando] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportando, setExportando] = useState(false)

  const cargarEmpleados = async (texto = busqueda) => {
    const res = await api.get('/empleados', { params: { busqueda: texto } })
    setEmpleados(res.data)
  }

  useEffect(() => {
    const cargarInicial = async () => {
      const res = await api.get('/empleados', { params: { busqueda: '' } })
      setEmpleados(res.data)
    }

    cargarInicial()
  }, [])

  const crearEmpleado = async () => {
    if (editando) {
      const res = await api.put(`/empleados/${editando}`, { ...form, rut: undefined })
      setEmpleados(empleados.map(empleado => empleado.rut === editando ? res.data : empleado))
    } else {
      const res = await api.post('/empleados', form)
      setEmpleados([...empleados, res.data])
    }
    limpiarFormulario()
  }

  const editarEmpleado = (empleado) => {
    setForm({ ...empleado, salario: empleado.salario || '' })
    setEditando(empleado.rut)
  }

  const limpiarFormulario = () => {
    setForm({ rut: '', cargo: '', telefono: '', fecha_ingreso: '', salario: '' })
    setEditando(null)
  }

  const buscarEmpleados = (e) => {
    e.preventDefault()
    cargarEmpleados()
  }

  const eliminarEmpleado = async (rut) => {
    await api.delete(`/empleados/${rut}`)
    cargarEmpleados()
  }

  const actualizarCampo = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    await crearEmpleado()
  }

  const exportarEmpleados = async () => {
    setExportando(true)
    setExportError('')
    try {
      const { data } = await api.get('/empleados/exportar', {
        params: { busqueda },
        responseType: 'blob'
      })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'empleados.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setExportError('No se pudo exportar la lista de empleados')
    } finally {
      setExportando(false)
    }
  }

  const descargarPlantilla = () => {
    const template = '\uFEFFRUT,Cargo,Teléfono,Fecha de ingreso,Salario\r\n'
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'plantilla-empleados.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importarArchivo = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const archivo = formElement.elements.archivo.files[0]
    if (!archivo) return

    const formData = new FormData()
    formData.append('archivo', archivo)
    setImportando(true)
    setImportResult(null)
    try {
      const { data } = await api.post('/empleados/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImportResult(data)
      await cargarEmpleados()
      formElement.reset()
    } catch (error) {
      setImportResult({ message: error.response?.data?.message || 'No se pudo importar el archivo' })
    } finally {
      setImportando(false)
    }
  }

  const tituloFormulario = editando ? 'Editar mecánico' : 'Agregar mecánico'

  return (
    <div className="empleados-page">
      <h2>Recursos Humanos - Empleados</h2>

      <form className="empleados-busqueda" onSubmit={buscarEmpleados}>
        <input
          placeholder="Buscar por RUT o cargo"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <button type="submit">Buscar</button>
        <button type="button" onClick={() => { setBusqueda(''); cargarEmpleados('') }}>Mostrar todos</button>
      </form>

      <section className="empleados-import">
        <div className="empleados-import-actions">
          <button type="button" onClick={exportarEmpleados} disabled={exportando}>
            {exportando ? 'Exportando...' : 'Exportar empleados a Excel'}
          </button>
          <button type="button" onClick={descargarPlantilla}>Descargar plantilla</button>
        </div>
        {exportError && <p role="alert">{exportError}</p>}
        <form onSubmit={importarArchivo}>
          <label htmlFor="archivo-empleados">Importar Excel o CSV</label>
          <small>Columnas obligatorias: RUT y Cargo. Opcionales: Teléfono, Fecha de ingreso (AAAA-MM-DD) y Salario.</small>
          <input id="archivo-empleados" name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
          <button type="submit" disabled={importando}>{importando ? 'Importando...' : 'Importar empleados'}</button>
        </form>
        {importResult && (
          <div className="empleados-import-result" role="status">
            {importResult.message ? (
              <strong>{importResult.message}</strong>
            ) : (
              <>
                <strong>{importResult.imported} fila(s) importada(s) o actualizada(s)</strong>
                <span>{importResult.rejected} fila(s) rechazada(s)</span>
                {importResult.errors?.length > 0 && (
                  <ul>
                    {importResult.errors.map((error) => (
                      <li key={error.fila}>Fila {error.fila}: {error.motivo}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <h3>{tituloFormulario}</h3>
      <form className="empleados-form" onSubmit={manejarEnvio}>
        <input name="rut" placeholder="RUT" value={form.rut} onChange={actualizarCampo} disabled={Boolean(editando)} required />
        <input name="cargo" placeholder="Cargo" value={form.cargo} onChange={actualizarCampo} required />
        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={actualizarCampo} />
        <input name="fecha_ingreso" type="date" value={form.fecha_ingreso?.slice(0, 10) || ''} onChange={actualizarCampo} />
        <input name="salario" type="number" min="0" step="0.01" placeholder="Salario" value={form.salario} onChange={actualizarCampo} />
        <button type="submit">{editando ? 'Guardar cambios' : 'Agregar'}</button>
        {editando && <button type="button" onClick={limpiarFormulario}>Cancelar</button>}
      </form>

      <div className="empleados-table-wrapper">
        <table>
          <thead>
            <tr><th>RUT</th><th>Usuario</th><th>Correo</th><th>Cargo</th><th>Teléfono</th><th>Fecha ingreso</th><th>Salario</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {empleados.map(empleado => (
              <tr key={empleado.rut}>
                <td>{empleado.rut}</td>
                <td>{empleado.usuario_nombre || 'Sin cuenta vinculada'}</td>
                <td>{empleado.usuario_email || '-'}</td>
                <td>{empleado.cargo}</td>
                <td>{empleado.telefono}</td>
                <td>{empleado.fecha_ingreso}</td>
                <td>{empleado.salario ?? '-'}</td>
                <td className="empleados-actions">
                  <button onClick={() => editarEmpleado(empleado)}>Editar</button>
                  <button onClick={() => eliminarEmpleado(empleado.rut)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Empleados
