/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import api from '../services/api.js'
import '../styles/Usuarios.css'

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [exportando, setExportando] = useState(false)
  const [errorExportacion, setErrorExportacion] = useState('')
  const [importando, setImportando] = useState(false)
  const [resultadoImportacion, setResultadoImportacion] = useState(null)
  const [form, setForm] = useState({
    rut: '',
    nombre: '',
    email: '',
    rol: '',
    tipo_usuario: '',
    estado: '',
    password: ''
  })

  const fetchUsuarios = async () => {
    const response = await api.get('/usuarios')
    setUsuarios(response.data)
  }

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const response = await api.get('/usuarios')
        setUsuarios(response.data)
      } catch (error) {
        console.error('Error al obtener usuarios:', error)
      }
    }
    cargarUsuarios()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/usuarios', form)
    setForm({
      rut: '',
      nombre: '',
      email: '',
      rol: '',
      tipo_usuario: '',
      estado: '',
      password: ''
    })
    fetchUsuarios() // refrescar lista
  }

  const exportarUsuarios = async () => {
    setExportando(true)
    setErrorExportacion('')
    try {
      const { data } = await api.get('/usuarios/exportar', { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'usuarios.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Error al exportar usuarios:', error)
      setErrorExportacion('No se pudo exportar la lista de usuarios.')
    } finally {
      setExportando(false)
    }
  }

  const descargarPlantilla = () => {
    const plantilla = '\uFEFFRUT,Nombre,Correo,Rol,Contraseña,Tipo de usuario,Estado,Cargo,Teléfono\r\n'
    const url = URL.createObjectURL(new Blob([plantilla], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'plantilla-usuarios.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importarUsuarios = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const archivo = formElement.elements.archivo.files[0]
    if (!archivo) return

    const formData = new FormData()
    formData.append('archivo', archivo)
    setImportando(true)
    setResultadoImportacion(null)
    try {
      const { data } = await api.post('/usuarios/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResultadoImportacion(data)
      formElement.reset()
      try {
        await fetchUsuarios()
      } catch (error) {
        console.error('No se pudo actualizar la lista de usuarios después de importar:', error)
      }
    } catch (error) {
      console.error('Error al importar usuarios:', error)
      setResultadoImportacion({
        message: error.response?.data?.message || 'No se pudo importar el archivo de usuarios'
      })
    } finally {
      setImportando(false)
    }
  }

  return (
    <div>
      <h2>Lista de Usuarios</h2>
      <div className="usuarios-actions">
        <button type="button" onClick={exportarUsuarios} disabled={exportando}>
          {exportando ? 'Exportando...' : 'Exportar usuarios a Excel'}
        </button>
        <button type="button" onClick={descargarPlantilla}>Descargar plantilla de carga</button>
      </div>
      {errorExportacion && <p role="alert">{errorExportacion}</p>}
      <section className="usuarios-import">
        <form onSubmit={importarUsuarios}>
          <label htmlFor="archivo-usuarios">Importar usuarios desde Excel o CSV</label>
         
          <input id="archivo-usuarios" name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
          <button type="submit" disabled={importando}>
            {importando ? 'Importando...' : 'Importar usuarios'}
          </button>
        </form>
        {resultadoImportacion && (
          <div className="usuarios-import-result" role="status">
            {resultadoImportacion.message ? (
              <strong>{resultadoImportacion.message}</strong>
            ) : (
              <>
                <strong>{resultadoImportacion.imported} usuario(s) importado(s)</strong>
                <span>{resultadoImportacion.rejected} fila(s) rechazada(s)</span>
                {resultadoImportacion.errors?.length > 0 && (
                  <ul>
                    {resultadoImportacion.errors.map((error) => (
                      <li key={error.fila}>Fila {error.fila}: {error.motivo}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </section>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th><th>RUT</th><th>Nombre</th><th>Email</th>
            <th>Rol</th><th>Tipo Usuario</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.rut}>
              <td>{u.rut}</td>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.rol}</td>
              <td>{u.tipo_usuario}</td>
              <td>{u.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Crear Usuario</h3>
      <form onSubmit={handleSubmit}>
        <input name="rut" placeholder="RUT" value={form.rut} onChange={handleChange} />
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />

        <select name="rol" value={form.rol} onChange={handleChange}>
          <option value="">Selecciona un rol</option>
          <option value="admin">Administrador</option>
          <option value="mecanico">Mecánico</option>
          <option value="oficina">Oficina</option>
          <option value="bodega">Bodega</option>
          <option value="pintura">Pintura</option>
        </select>

        <select name="tipo_usuario" value={form.tipo_usuario} onChange={handleChange}>
          <option value="">Selecciona tipo de usuario</option>
          <option value="empleado">Empleado</option>
          <option value="cliente">Cliente</option>
          <option value="proveedor">Proveedor</option>
          <option value="general">General</option>
        </select>

        <input name="estado" placeholder="Estado" value={form.estado} onChange={handleChange} />
        <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} />
        <button type="submit">Crear</button>
      </form>
    </div>
  )
}

export default Usuarios
