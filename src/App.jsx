import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import Usuarios from './Frontend/Paginas/usuario.jsx'
import Login from './Frontend/Paginas/Login.jsx'
import Inventario from './Frontend/Paginas/Inventario.jsx'
import Inicio from './Frontend/Paginas/Inicio.jsx'
import './Frontend/styles/Sidebar.css'   
import { useState } from 'react'
import { FiLogOut } from "react-icons/fi";
import Empleados from './Frontend/Paginas/Empleados.jsx' 
import Asistencia from './Frontend/Paginas/Asistencia.jsx'
import RRHH from './Frontend/Paginas/RRHH/RRHH.jsx'
import RRHHModulo from './Frontend/Paginas/RRHH/RRHHModulo.jsx'

// 🔹 Componente para proteger rutas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/" />
}

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/inicio" element={<PrivateRoute><Inicio /></PrivateRoute>} />
            <Route path="/rrhh" element={<PrivateRoute><RRHH /></PrivateRoute>} />
            <Route path="/usuarios" element={<PrivateRoute><Usuarios /></PrivateRoute>} />
            <Route path="/inventario" element={<PrivateRoute><Inventario /></PrivateRoute>} />
            <Route path="/empleados" element={<PrivateRoute><Empleados /></PrivateRoute>} />
            <Route path="/asistencia" element={<PrivateRoute><Asistencia /></PrivateRoute>} />
            <Route path="/rrhh/:modulo" element={<PrivateRoute><RRHHModulo /></PrivateRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

function Sidebar() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')   // 🔹 borra token
    navigate('/')                      // 🔹 redirige al login
  }

  // 🔹 Ocultar barra si no hay token
  const token = localStorage.getItem('token')
  if (!token) return null

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <h2>Gestor Taller</h2>
      <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? '➡️' : '⬅️'}
      </button>
      <ul>
        <li><Link to="/inicio">🏠<span> Inicio</span></Link></li>
        <li><Link to="/rrhh">👥<span> Recursos Humanos</span></Link></li>
        <li><Link to="/inventario">📦<span> Inventario</span></Link></li>
        <li>
          <button onClick={handleLogout}>
            <FiLogOut size={20} /> <span>Cerrar sesión</span>
          </button>
        </li>
      </ul>
    </div>
  )
}

export default App
