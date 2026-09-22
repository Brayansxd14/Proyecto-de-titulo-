/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import api from '../services/api'
import '../styles/Inventario.css'

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

      {/* Botones para alternar formularios */}
      <div className="inventario-botones">
        <button onClick={() => setFormularioActivo(formularioActivo === 'agregar' ? null : 'agregar')}>
          {formularioActivo === 'agregar' ? 'Ocultar formulario de agregar' : 'Agregar repuesto'}
        </button>
        <button onClick={() => setFormularioActivo(formularioActivo === 'buscar' ? null : 'buscar')}>
          {formularioActivo === 'buscar' ? 'Ocultar formulario de búsqueda' : 'Buscar repuesto'}
        </button>
        <button onClick={() => setFormularioActivo(formularioActivo === 'reporte' ? null : 'reporte')}>
          {formularioActivo === 'reporte' ? 'Ocultar reporte' : 'Generar reporte'}
        </button>
        <button onClick={() => setFormularioActivo(formularioActivo === 'importar' ? null : 'importar')}>
          {formularioActivo === 'importar' ? 'Ocultar importación' : 'Importar Excel o CSV'}
        </button>
      </div>

      {formularioActivo === 'importar' && (
        <form onSubmit={importarArchivo} className="inventario-import-form">
          <div>
            <strong>Carga masiva de inventario</strong>
            <small>Columnas: numero_serie o codigo, nombre, cantidad, precio, tipo y proveedor.</small>
          </div>
          <input name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
          <button type="submit">Subir datos</button>
        </form>
      )}

      {importResult && (
        <div className="inventario-import-result">
          {importResult.message ? <strong>{importResult.message}</strong> : <><strong>{importResult.imported} fila(s) importada(s)</strong><span>{importResult.rejected} fila(s) rechazada(s)</span>{importResult.errors?.length > 0 && <ul>{importResult.errors.map(error => <li key={error.fila}>Fila {error.fila}: {error.motivo}</li>)}</ul>}</>}
        </div>
      )}

      {formularioActivo === 'agregar' && (
        <form onSubmit={handleSubmit} className="inventario-form">
          <input name="numero_serie" placeholder="Número de serie" value={form.numero_serie} onChange={handleChange} disabled={Boolean(editando)} required />
          <input name="nombre" placeholder="Nombre del repuesto" value={form.nombre} onChange={handleChange} required />
          <input name="cantidad" type="number" min="0" placeholder="Cantidad" value={form.cantidad} onChange={handleChange} required />
          <input name="precio" type="number" min="0" step="0.01" placeholder="Precio" value={form.precio} onChange={handleChange} required />
          <select name="tipo" value={form.tipo} onChange={handleChange} required>
            <option value="">Selecciona tipo</option>
            <option value="Motor">Motor</option>
            <option value="Frenos">Frenos</option>
            <option value="Suspensión">Suspensión</option>
            <option value="Eléctrico">Eléctrico</option>
            <option value="otro">Otro</option>
          </select>
          {form.tipo === 'otro' && <input name="tipoOtro" placeholder="Especifica el tipo" value={form.tipoOtro} onChange={handleChange} required />}
          <select name="proveedor" value={form.proveedor} onChange={handleChange}>
            <option value="">Selecciona proveedor</option>
            {proveedores.map(proveedor => <option key={proveedor.id} value={proveedor.nombre}>{proveedor.nombre}</option>)}
            <option value="otro">Otro proveedor</option>
          </select>
          {form.proveedor === 'otro' && <input name="proveedorOtro" placeholder="Nombre del nuevo proveedor" value={form.proveedorOtro} onChange={handleChange} required />}
          <button type="submit">{editando ? 'Guardar cambios' : 'Agregar repuesto'}</button>
          {editando && <button type="button" onClick={handleClear}>Cancelar</button>}
        </form>
      )}

      {formularioActivo === 'buscar' && (
        <form onSubmit={buscarRepuesto} className="inventario-form">
          <input placeholder="Número de serie" value={filtros.numero_serie} onChange={e => setFiltros({ ...filtros, numero_serie: e.target.value })} />
          <input placeholder="Nombre" value={filtros.nombre} onChange={e => setFiltros({ ...filtros, nombre: e.target.value })} />
          <select value={filtros.proveedor} onChange={e => setFiltros({ ...filtros, proveedor: e.target.value })}>
            <option value="">Cualquier proveedor</option>
            {proveedores.map(proveedor => <option key={proveedor.id} value={proveedor.nombre}>{proveedor.nombre}</option>)}
          </select>
          <select value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="">Cualquier tipo</option>
            <option value="Motor">Motor</option>
            <option value="Frenos">Frenos</option>
            <option value="Suspensión">Suspensión</option>
            <option value="Eléctrico">Eléctrico</option>
          </select>
          <select value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}>
            <option value="">Cualquier estado</option>
            <option value="con stock">Con stock</option>
            <option value="sin stock">Sin stock</option>
          </select>
          <input type="number" min="0" placeholder="Cantidad mínima" value={filtros.cantidadMin} onChange={e => setFiltros({ ...filtros, cantidadMin: e.target.value })} />
          <input type="number" min="0" placeholder="Cantidad máxima" value={filtros.cantidadMax} onChange={e => setFiltros({ ...filtros, cantidadMax: e.target.value })} />
          <button type="submit">Buscar repuestos</button>
          <button type="button" onClick={async () => { setFiltros({ ...filtros, numero_serie: '', nombre: '', proveedor: '', tipo: '', estado: '', cantidadMin: '', cantidadMax: '' }); const res = await api.get('/inventario'); setProductos(res.data) }}>Mostrar todo</button>
        </form>
      )}

      {/* Formulario de reporte */}
      {formularioActivo === 'reporte' && (
        <form onSubmit={generarReporte} className="inventario-reporte">
          <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })} />
          <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })} />
          <select name="proveedor" value={filtros.proveedor} onChange={(e) => setFiltros({ ...filtros, proveedor: e.target.value })}>
            <option value="">Cualquier proveedor</option>
            {proveedores.map(proveedor => <option key={proveedor.id} value={proveedor.nombre}>{proveedor.nombre}</option>)}
          </select>
          <button type="submit">Generar Reporte</button>
        </form>
      )}

      {/* Tabla de reporte */}
      {reporte.length > 0 && (
        <div>
          <h3>Reporte de salidas</h3>
          <table>
            <thead>
              <tr>
                <th>Repuesto</th>
                <th>Proveedor</th>
                <th>Total Salidas</th>
              </tr>
            </thead>
            <tbody>
              {reporte.map((item, index) => (
                <tr key={index}>
                  <td>{item.repuesto}</td>
                  <td>{item.proveedor}</td>
                  <td>{item.total_salidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista de repuestos */}
      <h3>Lista de repuestos</h3>
      <div className="inventario-table-wrapper">
        <table className="inventario-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Repuesto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Proveedor</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.numero_serie}>
                <td><strong>{p.numero_serie}</strong></td>
                <td>{p.nombre}</td>
                <td>{p.tipo || '-'}</td>
                <td>{p.cantidad}</td>
                <td>${Number(p.precio || 0).toLocaleString('es-CL')}</td>
                <td>{p.proveedor || '-'}</td>
                <td><span className={`inventario-status ${p.estado === 'con stock' ? 'available' : 'empty'}`}>{p.estado}</span></td>
                <td><div className="inventario-item-actions"><button className="inventario-edit-button" onClick={() => handleEdit(p)}>Editar</button><button className="inventario-delete-button" onClick={() => handleDelete(p.numero_serie)}>Eliminar</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {productos.length === 0 && <p className="inventario-empty">No hay repuestos registrados.</p>}
      </div>
    </div>
  )
}

export default Inventario
