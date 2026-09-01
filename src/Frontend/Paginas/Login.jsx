/* eslint-disable no-unused-vars */

import React, { useState } from 'react'
import api from '../services/api'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [mensaje, setMensaje] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/login', form)
      const { token, usuario } = response.data

      // Guardar token en localStorage
      localStorage.setItem('token', token)
      setMensaje(`Bienvenido ${usuario.nombre}, rol: ${usuario.rol}`)
    } catch (error) {
      setMensaje('Error en inicio de sesión')
    }
  }

  return (
    <div>
      <h2>Inicio de Sesión</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
        />
        <button type="submit">Ingresar</button>
      </form>
      <p>{mensaje}</p>
    </div>
  )
}

export default Login
