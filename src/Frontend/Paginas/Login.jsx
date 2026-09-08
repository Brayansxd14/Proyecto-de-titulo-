/* eslint-disable no-undef */
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import '../styles/Login.css'
import { useState } from 'react'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setMensaje('Por favor ingresa tu correo y contraseña')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/login', form)
      const { token, usuario } = response.data

      localStorage.setItem('token', token)
      setMensaje(`Bienvenido ${usuario.nombre}, rol: ${usuario.rol}`)
      navigate('/inicio')
    } catch (err) {
      console.error(err)
      setMensaje('Error en inicio de sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
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
          <button type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p>{mensaje}</p>
      </div>
    </div>
  )
}

export default Login
