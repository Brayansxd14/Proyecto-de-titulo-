/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import api from '../services/api'

const Inventario = () => {
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState({
    numero_serie: '',
    nombre: '',
    cantidad: 0,
    precio: 0,
    tipo: '',
    tipoOtro: '',
    proveedor: '',
  })
  const [editando, setEditando] = useState(null)

  // Obtener inventario al cargar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/inventario')
        setProductos(res.data)
      } catch (err) {
        console.error('Error al obtener inventario:', err)
      }
    }
    fetchData()
  }, [])

  // Manejo de inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Crear o actualizar repuesto
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Si seleccionó "otro", usamos el valor de tipoOtro
      const tipoFinal = form.tipo === 'otro' ? form.tipoOtro : form.tipo

      if (editando) {
        const res = await api.put(`/inventario/${editando}`, { ...form, tipo: tipoFinal })
        setProductos(productos.map(p => p.numero_serie === editando ? res.data : p))
        setEditando(null)
      } else {
        const res = await api.post('/inventario', { ...form, tipo: tipoFinal })
        setProductos([...productos, res.data])
      }

      // Resetear formulario
      setForm({ numero_serie: '', nombre: '', cantidad: 0, precio: 0, tipo: '', tipoOtro: '', proveedor:  '' })
    } catch (err) {
      console.error('Error al guardar repuesto:', err)
    }
  }

  // Editar repuesto
  const handleEdit = (p) => {
    setForm({ ...p, tipoOtro: p.tipo }) // si era "otro", lo cargamos en tipoOtro
    setEditando(p.numero_serie)
  }

  // Eliminar repuesto
  const handleDelete = async (numero_serie) => {
    try {
      await api.delete(`/inventario/${numero_serie}`)
      setProductos(productos.filter(p => p.numero_serie !== numero_serie))
    } catch (err) {
      console.error('Error al eliminar repuesto:', err)
    }
  }
  const handleClear = () => {
  setForm({
    numero_serie: '',
    nombre: '',
    cantidad: 0,
    precio: 0,
    tipo: '',
    tipoOtro: '',
    proveedor: '',
    descripcion: ''
  })
  setEditando(null) // cancela edición si estabas editando
}



  return (
    <div>
      <h2>Inventario de Repuestos</h2>
      <form onSubmit={handleSubmit}>
        <input name="numero_serie" placeholder="Número de serie (ID)" value={form.numero_serie} onChange={handleChange} disabled={!!editando} />
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
        <input name="cantidad" type="number" placeholder="Cantidad" value={form.cantidad} onChange={handleChange} />
        <input name="precio" type="number" placeholder="Precio" value={form.precio} onChange={handleChange} />


        <select name="tipo" value={form.tipo} onChange={handleChange}>
          <option value="">Seleccione tipo</option>
          <option value="mecanica">Mecánica</option>
          <option value="pintura">Pintura</option>
          <option value="otro">Otro</option>
        </select>

        {form.tipo === 'otro' && (
          <input
            name="tipoOtro"
            placeholder="Especifique tipo"
            value={form.tipoOtro}
            onChange={handleChange}
          />
        )}

        <input name="proveedor" placeholder="Proveedor" value={form.proveedor} onChange={handleChange} />
       <button type="button" onClick={handleClear}>Limpiar formulario</button>
        <button type="submit">{editando ? 'Actualizar' : 'Agregar'} repuesto</button>
      </form>

      <h3>Lista de repuestos</h3>
      <ul>
        {productos.map((p) => (
          <li key={p.numero_serie}>
            <strong>{p.numero_serie}</strong> - {p.nombre} ({p.tipo})  
            | {p.cantidad} unidades | ${p.precio} | Proveedor: {p.proveedor}  
            ➝ Estado: {p.estado}
            <button onClick={() => handleEdit(p)}>Editar</button>
            <button onClick={() => handleDelete(p.numero_serie)}>Eliminar</button>
    


          </li>
        ))}
      </ul>
    </div>
  )
}

export default Inventario
