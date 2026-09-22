import { useEffect, useState } from 'react'
import api from '../services/api'
import '../styles/Proveedores.css'

const formularioInicial = {
  nombre: '',
  rut: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  estado: 'Activo'
}

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([])
  const [form, setForm] = useState(formularioInicial)
  const [editando, setEditando] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const cargarProveedores = async () => {
    const res = await api.get('/proveedores')
    setProveedores(res.data)
  }

  useEffect(() => {
    const cargarInicial = async () => {
      await cargarProveedores()
    }
    cargarInicial()
  }, [])

  const actualizarCampo = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const limpiar = () => {
    setForm(formularioInicial)
    setEditando(null)
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (editando) {
      const res = await api.put(`/proveedores/${editando}`, form)
      setProveedores(proveedores.map(proveedor => proveedor.id === editando ? res.data : proveedor))
    } else {
      const res = await api.post('/proveedores', form)
      setProveedores([...proveedores, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    }
    limpiar()
  }

  const editar = (proveedor) => {
    setForm({
      nombre: proveedor.nombre || '',
      rut: proveedor.rut || '',
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
      estado: proveedor.estado || 'Activo'
    })
    setEditando(proveedor.id)
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor?')) return
    await api.delete(`/proveedores/${id}`)
    setProveedores(proveedores.filter(proveedor => proveedor.id !== id))
  }

  const importarArchivo = async (event) => {
    event.preventDefault()
    const archivo = event.currentTarget.elements.archivo.files[0]
    if (!archivo) return
    const data = new FormData()
    data.append('archivo', archivo)
    try {
      const response = await api.post('/proveedores/importar', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      setImportResult(response.data)
      await cargarProveedores()
      event.currentTarget.reset()
    } catch (error) {
      setImportResult({ message: error.response?.data?.message || 'No se pudo importar el archivo' })
    }
  }

  return (
    <div className="proveedores-page">
      <h2>Proveedores</h2>
      <p>Administra los proveedores disponibles para el inventario.</p>

      <form className="proveedores-import-form" onSubmit={importarArchivo}>
        <div><strong>Importar proveedores</strong><small>Columnas: nombre, rut, contacto, telefono, email, direccion y estado.</small></div>
        <input name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
        <button type="submit">Subir Excel o CSV</button>
      </form>
      {importResult && <div className="proveedores-import-result">{importResult.message ? <strong>{importResult.message}</strong> : <><strong>{importResult.imported} importado(s)</strong><span>{importResult.rejected} rechazado(s)</span>{importResult.errors?.length > 0 && <ul>{importResult.errors.map(error => <li key={error.fila}>Fila {error.fila}: {error.motivo}</li>)}</ul>}</>}</div>}

      <form className="proveedores-form" onSubmit={guardar}>
        <input name="nombre" placeholder="Nombre del proveedor" value={form.nombre} onChange={actualizarCampo} required />
        <input name="rut" placeholder="RUT" value={form.rut} onChange={actualizarCampo} />
        <input name="contacto" placeholder="Persona de contacto" value={form.contacto} onChange={actualizarCampo} />
        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={actualizarCampo} />
        <input name="email" type="email" placeholder="Correo electrónico" value={form.email} onChange={actualizarCampo} />
        <input name="direccion" placeholder="Dirección" value={form.direccion} onChange={actualizarCampo} />
        <select name="estado" value={form.estado} onChange={actualizarCampo}>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
        <button type="submit">{editando ? 'Guardar cambios' : 'Agregar proveedor'}</button>
        {editando && <button type="button" onClick={limpiar}>Cancelar</button>}
      </form>

      <div className="proveedores-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map(proveedor => (
              <tr key={proveedor.id}>
                <td>{proveedor.nombre}</td>
                <td>{proveedor.rut || '-'}</td>
                <td>{proveedor.contacto || '-'}</td>
                <td>{proveedor.telefono || '-'}</td>
                <td>{proveedor.email || '-'}</td>
                <td>{proveedor.estado}</td>
                <td className="proveedores-actions">
                  <button type="button" onClick={() => editar(proveedor)}>Editar</button>
                  <button type="button" onClick={() => eliminar(proveedor.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {proveedores.length === 0 && <p>No hay proveedores registrados.</p>}
      </div>
    </div>
  )
}

export default Proveedores
