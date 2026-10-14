/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import api from '../services/api'
import '../styles/Inventario.css'
import AccionesSection from './Inventario/sections/AccionesSection.jsx'
import RepuestoFormSection from './Inventario/sections/RepuestoFormSection.jsx'
import BuscarRepuestoSection from './Inventario/sections/BuscarRepuestoSection.jsx'
import ReporteSection from './Inventario/sections/ReporteSection.jsx'
import ProductosTableSection from './Inventario/sections/ProductosTableSection.jsx'

const Inventario = () => {
  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [form, setForm] = useState({
    numero_serie: '',
    nombre: '',
    cantidad: 0,
    precio: 0,
    tipo: '',
    tipoOtro: '',
    proveedor: '',
    descripcion: ''
  })
  const [editando, setEditando] = useState(null)
  const [formularioActivo, setFormularioActivo] = useState(null)
  const [filtros, setFiltros] = useState({
    nombre: '',
    numero_serie: '',
    proveedor: '',
    tipo: '',
    estado: '',
    cantidadMin: '',
    cantidadMax: '',
    fechaInicio: '',
    fechaFin: ''
  })

  const [reporte, setReporte] = useState([])
  const [importResult, setImportResult] = useState(null)

  // 🔹 Cargar inventario al inicio
  useEffect(() => {
    const cargarInventario = async () => {
      try {
        const res = await api.get('/inventario')
        setProductos(res.data)
      } catch (err) {
        console.error('Error al obtener inventario:', err)
      }
    }
    cargarInventario()
    const cargarProveedores = async () => {
      try {
        const res = await api.get('/proveedores')
        setProveedores(res.data)
      } catch (err) {
        console.error('Error al obtener proveedores:', err)
      }
    }
    cargarProveedores()
  }, [])

  // 🔹 Manejo de inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // 🔹 Crear o actualizar repuesto
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const tipoFinal = form.tipo === 'otro' ? form.tipoOtro : form.tipo
      const proveedorFinal = form.proveedor === 'otro' ? form.proveedorOtro : form.proveedor

      if (editando) {
        const res = await api.put(`/inventario/${editando}`, { ...form, tipo: tipoFinal, proveedor: proveedorFinal })
        setProductos(productos.map(p => p.numero_serie === editando ? res.data : p))
        setEditando(null)
      } else {
        const res = await api.post('/inventario', { ...form, tipo: tipoFinal, proveedor: proveedorFinal })
        setProductos([...productos, res.data])
      }

      handleClear()
    } catch (err) {
      console.error('Error al guardar repuesto:', err)
    }
  }

  // 🔹 Editar repuesto
  const handleEdit = (p) => {
    const proveedorRegistrado = proveedores.some(proveedor => proveedor.nombre === p.proveedor)
    setForm({
      ...p,
      tipoOtro: p.tipo,
      proveedor: proveedorRegistrado ? p.proveedor : 'otro',
      proveedorOtro: proveedorRegistrado ? '' : (p.proveedor || '')
    })
    setEditando(p.numero_serie)
    setFormularioActivo('agregar')
  }

  // 🔹 Eliminar repuesto
  const handleDelete = async (numero_serie) => {
    try {
      await api.delete(`/inventario/${numero_serie}`)
      setProductos(productos.filter(p => p.numero_serie !== numero_serie))
    } catch (err) {
      console.error('Error al eliminar repuesto:', err)
    }
  }

  // 🔹 Limpiar formulario
  const handleClear = () => {
    setForm({
      numero_serie: '',
      nombre: '',
      cantidad: 0,
      precio: 0,
      tipo: '',
      tipoOtro: '',
      proveedor: '',
      proveedorOtro: '',
      descripcion: ''
    })
    setEditando(null)
  }

  const buscarRepuesto = async (e) => {
    e.preventDefault()
    try {
      const params = {
        numero_serie: filtros.numero_serie,
        nombre: filtros.nombre,
        proveedor: filtros.proveedor,
        tipo: filtros.tipo,
        estado: filtros.estado,
        cantidadMin: filtros.cantidadMin,
        cantidadMax: filtros.cantidadMax
      }
      const res = await api.get('/inventario/buscar', { params })
      setProductos(res.data)
    } catch (err) {
      console.error('Error al buscar repuesto:', err)
      setProductos([])
    }
  }

  const mostrarTodo = async () => {
    setFiltros({
      ...filtros,
      numero_serie: '',
      nombre: '',
      proveedor: '',
      tipo: '',
      estado: '',
      cantidadMin: '',
      cantidadMax: ''
    })
    const res = await api.get('/inventario')
    setProductos(res.data)
  }

  // 🔹 Generar reporte de salidas
  const generarReporte = async (e) => {
    e.preventDefault()
    try {
      const res = await api.get('/reporte-salidas', {
        params: {
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
          proveedor: filtros.proveedor
        }
      })
      setReporte(res.data)
    } catch (err) {
      console.error('Error al generar reporte:', err)
    }
  }

  const importarArchivo = async (event) => {
    event.preventDefault()
    const archivo = event.currentTarget.elements.archivo.files[0]
    if (!archivo) return
    const formData = new FormData()
    formData.append('archivo', archivo)
    try {
      const { data } = await api.post('/inventario/importar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setImportResult(data)
      const res = await api.get('/inventario')
      setProductos(res.data)
      event.currentTarget.reset()
    } catch (error) {
      setImportResult({ message: error.response?.data?.message || 'No se pudo importar el archivo' })
    }
  }

  return (
    <div>
      <h2>Inventario de Repuestos</h2>

      <AccionesSection
        activeForm={formularioActivo}
        onToggleForm={(name) =>
          setFormularioActivo(formularioActivo === name ? null : name)
        }
        importResult={importResult}
        onImport={importarArchivo}
      />

      {formularioActivo === 'agregar' && (
        <RepuestoFormSection
          form={form}
          proveedores={proveedores}
          editando={editando}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClear={handleClear}
        />
      )}

      {formularioActivo === 'buscar' && (
        <BuscarRepuestoSection
          filtros={filtros}
          proveedores={proveedores}
          onFilterChange={(name, value) =>
            setFiltros((current) => ({ ...current, [name]: value }))
          }
          onSearch={buscarRepuesto}
          onShowAll={mostrarTodo}
        />
      )}

      {/* Formulario de reporte */}
      {formularioActivo === 'reporte' && (
        <ReporteSection
          filtros={filtros}
          proveedores={proveedores}
          reporte={reporte}
          onFilterChange={(name, value) =>
            setFiltros((current) => ({ ...current, [name]: value }))
          }
          onGenerate={generarReporte}
        />
      )}

      {/* Lista de repuestos */}
      <ProductosTableSection
        productos={productos}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default Inventario
