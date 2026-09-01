/* eslint-disable no-unused-vars */
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Usuarios from './Frontend/Paginas/usuario.jsx'
import Login from './Frontend/Paginas/Login.jsx'
import Inventario from './Frontend/Paginas/Inventario.jsx'

function App() {
  return (
    <Router>
      <div className="App">
        <header>
          <h1>Gestor de Taller Mecánico</h1>
          {/* Barra de navegación */}
          <nav>
            <ul style={{ display: 'flex', gap: '20px', listStyle: 'none' }}>
              <li><Link to="/usuarios">Usuarios</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/inventario">Inventario</Link></li>
            </ul>
          </nav>
        </header>

        {/* Sección de páginas */}
        <main>
          <Routes>
        
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/login" element={<Login />} />
            <Route path="/inventario" element={<Inventario />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

