import { useEffect, useState } from 'react'
import api from '../services/api'
import '../styles/Proveedores.css'
import ImportarSection from './Proveedores/sections/ImportarSection.jsx'
import ProveedorFormSection from './Proveedores/sections/ProveedorFormSection.jsx'
import ProveedoresTableSection from './Proveedores/sections/ProveedoresTableSection.jsx'

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
  const [errorCarga, setErrorCarga] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargarProveedores = async () => {
    setCargando(true)
    try {
      const res = await api.get('/proveedores')
      setProveedores(res.data)
      setErrorCarga('')
    } catch {
      setErrorCarga('No se pudieron cargar los proveedores. Revisa la conexión con la base de datos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let active = true
    api.get('/proveedores')
      .then(res => {
        if (active) setProveedores(res.data)
      })
      .catch(() => {
        if (active) setErrorCarga('No se pudieron cargar los proveedores. Revisa la conexión con la base de datos.')
      })
      .finally(() => {
        if (active) setCargando(false)
      })

    return () => { active = false }
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
    try {
      if (editando) {
        const res = await api.put(`/proveedores/${editando}`, form)
        setProveedores(proveedores.map(proveedor => proveedor.id === editando ? res.data : proveedor))
      } else {
        const res = await api.post('/proveedores', form)
        setProveedores([...proveedores, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      }
      setErrorCarga('')
      limpiar()
    } catch {
      setErrorCarga('No se pudo guardar el proveedor. Revisa la conexión con la base de datos e inténtalo de nuevo.')
    }
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
    try {
      await api.delete(`/proveedores/${id}`)
      setProveedores(proveedores.filter(proveedor => proveedor.id !== id))
      setErrorCarga('')
    } catch {
      setErrorCarga('No se pudo eliminar el proveedor. Revisa la conexión con la base de datos e inténtalo de nuevo.')
    }
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
      {errorCarga && <div className="proveedores-load-error" role="alert"><span>{errorCarga}</span><button type="button" onClick={cargarProveedores} disabled={cargando}>{cargando ? 'Conectando...' : 'Reintentar'}</button></div>}

      <ImportarSection importResult={importResult} onImport={importarArchivo} />
      <ProveedorFormSection
        form={form}
        editing={editando}
        onChange={actualizarCampo}
        onSubmit={guardar}
        onCancel={limpiar}
      />
      <ProveedoresTableSection
        proveedores={proveedores}
        cargando={cargando}
        errorCarga={errorCarga}
        onEdit={editar}
        onDelete={eliminar}
      />
    </div>
  )
}

export default Proveedores
