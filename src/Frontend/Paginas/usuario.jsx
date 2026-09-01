/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import api from '../services/api.js'

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', rol: '', estado: '', password: '' })

  const fetchUsuarios = async () => {
    const response = await api.get('/usuarios')
    setUsuarios(response.data)
  }

 useEffect(() => {
  const cargarUsuarios = async () => {
    try {
      const response = await api.get('/usuarios')
      setUsuarios(response.data) // aquí sí puedes actualizar el estado
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
    setForm({ nombre: '', email: '', rol: '', estado: '', password: '' })
    fetchUsuarios() // refrescar lista
  }

  return (
    <div>
      <h2>Lista de Usuarios</h2>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td><td>{u.nombre}</td><td>{u.email}</td><td>{u.rol}</td><td>{u.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Crear Usuario</h3>
      <form onSubmit={handleSubmit}>
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <select name="rol" value={form.rol} onChange={handleChange}>
             <option value="">Selecciona un rol</option>
             <option value="mecanico">Mecánico</option>
             <option value="oficina">Oficina</option>
             <option value="bodega">Bodega</option>
            <option value="pintura">Pintura</option>
            </select>

        <input name="estado" placeholder="Estado" value={form.estado} onChange={handleChange} />
        <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} />
        <button type="submit">Crear</button>
      </form>
    </div>
  )
}

export default Usuarios
