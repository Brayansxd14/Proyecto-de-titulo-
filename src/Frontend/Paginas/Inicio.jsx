/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import api from '../services/api'
import logo from '../Imagenes/images.jpg'
import '../styles/Inicio.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const Inicio = () => {
  const [reporte, setReporte] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/reporte-salidas', {
          params: { fechaInicio: '2026-09-01', fechaFin: '2026-09-07' } // 🔹 rango de ejemplo
        })
        setReporte(res.data)
      } catch (err) {
        console.error('Error al obtener reporte:', err)
      }
    }
    fetchData()
  }, [])

  const data = {
    labels: reporte.map(item => item.repuesto),
    datasets: [
      {
        label: 'Repuestos usados',
        data: reporte.map(item => item.total_salidas),
        backgroundColor: '#4dd2e0'
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Reporte de salidas de repuestos' }
    }
  }

  return (
    <div className="inicio-container">
      <h2>Bienvenido al Gestor de Taller Mecánico</h2>
      <p>Selecciona una opción del menú lateral para comenzar:</p>

      {/* 🔹 Logo en el centro */}
      <div className="logo-container">
        <img src={logo} alt="Logo Empresa" className="logo" />
      </div>

      {/* 🔹 Gráfico debajo del logo */}
      <div className="grafico-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}

export default Inicio



