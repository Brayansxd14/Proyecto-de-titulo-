import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom'
import Usuarios from './Frontend/Paginas/usuario.jsx'
import Login from './Frontend/Paginas/Login.jsx'
import Inventario from './Frontend/Paginas/Inventario.jsx'
import Inicio from './Frontend/Paginas/Inicio.jsx'
import './Frontend/styles/Sidebar.css'   
import { useEffect, useState } from 'react'
import { FiLogOut } from "react-icons/fi";
import api from './Frontend/services/api'
import Empleados from './Frontend/Paginas/Empleados.jsx' 
import Asistencia from './Frontend/Paginas/Asistencia.jsx'
import Proveedores from './Frontend/Paginas/Proveedores.jsx'
import RRHH from './Frontend/Paginas/RRHH/RRHH.jsx'
import RRHHModulo from './Frontend/Paginas/RRHH/RRHHModulo.jsx'
import Taller from './Frontend/Paginas/Taller.jsx'
import Facturacion from './Frontend/Paginas/Facturacion.jsx'

// 🔹 Componente para proteger rutas
const PrivateRoute = ({ children, authStatus }) => {
  if (authStatus === 'checking') return null
  return authStatus === 'authenticated' ? children : <Navigate to="/" replace />
}

function App() {
  const [authStatus, setAuthStatus] = useState(() =>
    localStorage.getItem('token') ? 'checking' : 'unauthenticated'
  )
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      return
    }

    api.get('/session')
      .then(({ data }) => {
        setCurrentUser(data.usuario)
        setAuthStatus('authenticated')
      })
      .catch((error) => {
        localStorage.removeItem('token')
        setCurrentUser(null)
        setAuthStatus('unauthenticated')
        if (error.response?.status !== 401) {
          console.error('No se pudo validar la sesión', error)
        }
      })
  }, [])

  return (
    <Router>
      <div className="app-layout">
        <Sidebar
          authStatus={authStatus}
          onLogout={() => {
            setCurrentUser(null)
            setAuthStatus('unauthenticated')
          }}
        />
        <div className="main-content">
          <Routes>
            <Route path="/" element={
              authStatus === 'checking'
                ? null
                : authStatus === 'authenticated'
                  ? <Navigate to="/inicio" replace />
                  : <Login onLogin={(user) => {
                    setCurrentUser(user)
                    setAuthStatus('authenticated')
                  }} />
            } />
            <Route path="/inicio" element={<PrivateRoute authStatus={authStatus}><Inicio /></PrivateRoute>} />
            <Route path="/rrhh" element={<PrivateRoute authStatus={authStatus}><RRHH isAdmin={currentUser?.rol?.trim().toLowerCase() === 'admin'} /></PrivateRoute>} />
            <Route path="/usuarios" element={
              <PrivateRoute authStatus={authStatus}>
                {currentUser?.rol?.trim().toLowerCase() === 'admin'
                  ? <Usuarios />
                  : <section role="alert"><h2>Acceso restringido</h2><p>La gestión de usuarios está disponible solo para cuentas con rol administrador.</p></section>}
              </PrivateRoute>
            } />
            <Route path="/inventario" element={<PrivateRoute authStatus={authStatus}><Inventario /></PrivateRoute>} />
            <Route path="/proveedores" element={<PrivateRoute authStatus={authStatus}><Proveedores /></PrivateRoute>} />
            <Route path="/empleados" element={<PrivateRoute authStatus={authStatus}><Empleados /></PrivateRoute>} />
            <Route path="/asistencia" element={<PrivateRoute authStatus={authStatus}><Asistencia /></PrivateRoute>} />
            <Route path="/taller" element={<PrivateRoute authStatus={authStatus}><Taller /></PrivateRoute>} />
            <Route path="/taller/orden/:ordenId" element={<PrivateRoute authStatus={authStatus}><Taller /></PrivateRoute>} />
            <Route path="/facturacion" element={<PrivateRoute authStatus={authStatus}><Facturacion /></PrivateRoute>} />
            <Route path="/rrhh/:modulo" element={<PrivateRoute authStatus={authStatus}><RRHHModulo /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

function Sidebar({ authStatus, onLogout }) {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    onLogout()
    navigate('/')
  }

  if (authStatus !== 'authenticated') return null

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <h2>Gestor Taller</h2>
      <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? '➡️' : '⬅️'}
      </button>
      <ul>
        <li><NavLink to="/inicio" className={({ isActive }) => isActive ? 'active' : ''}>🏠<span> Inicio</span></NavLink></li>
        <li><NavLink to="/rrhh" className={({ isActive }) => isActive ? 'active' : ''}>👥<span> Recursos Humanos</span></NavLink></li>
        <li><NavLink to="/inventario" className={({ isActive }) => isActive ? 'active' : ''}>📦<span> Inventario</span></NavLink></li>
        <li><NavLink to="/taller" className={({ isActive }) => isActive ? 'active' : ''}>🔧<span> Taller</span></NavLink></li>
        <li><NavLink to="/facturacion" className={({ isActive }) => isActive ? 'active' : ''}>🧾<span> Facturación</span></NavLink></li>
        <li><NavLink to="/proveedores" className={({ isActive }) => isActive ? 'active' : ''}>🚚<span> Proveedores</span></NavLink></li>
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
