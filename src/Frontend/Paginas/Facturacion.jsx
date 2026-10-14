import { useEffect, useState } from 'react'
import { FiAlertCircle, FiCheck, FiFileText, FiPlus, FiRefreshCw, FiSearch, FiTrash2 } from 'react-icons/fi'
import api from '../services/api'
import '../styles/Facturacion.css'

const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`
const dateLabel = value => value ? String(value).slice(0, 10).split('-').reverse().join('/') : 'Sin fecha'

const errorMessage = error => {
  const message = error.response?.data?.error || error.response?.data || error.message
  return typeof message === 'string' ? message : 'No se pudo completar la operación'
}

function Facturacion() {
  const [invoices, setInvoices] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const cargarFacturacion = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/facturacion')
      setInvoices(data.invoices)
      setOrders(data.orders)
      setSelectedOrderId(current =>
        data.orders.some(order => String(order.entryId) === current)
          ? current
          : String(data.orders[0]?.entryId || '')
      )
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    api.get('/facturacion')
      .then(({ data }) => {
        if (!active) return
        setInvoices(data.invoices)
        setOrders(data.orders)
        setSelectedOrderId(String(data.orders[0]?.entryId || ''))
      })
      .catch(requestError => {
        if (active) setError(errorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const selectedOrder = orders.find(order => String(order.entryId) === selectedOrderId)
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'Pendiente de pago')
  const paidInvoices = invoices.filter(invoice => invoice.status === 'Pagada')
  const pendingTotal = pendingInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0)
  const paidTotal = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0)
  const visibleInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'Todas' || invoice.status === statusFilter
    const query = search.trim().toLowerCase()
    const haystack = `${invoice.number} ${invoice.entryNumber} ${invoice.plate} ${invoice.clientName} ${invoice.clientRut}`.toLowerCase()
    return matchesStatus && (!query || haystack.includes(query))
  })

  const crearFactura = async event => {
    event.preventDefault()
    if (!selectedOrder) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await api.post(`/facturacion/ordenes/${selectedOrder.entryId}/factura`)
      setNotice(`Factura creada para la orden ${selectedOrder.entryNumber}`)
      await cargarFacturacion()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const actualizarEstado = async (invoice, status) => {
    setError('')
    try {
      const { data } = await api.patch(`/taller/facturas/${invoice.id}`, { status })
      setInvoices(current => current.map(item => item.id === invoice.id ? { ...item, ...data } : item))
      setNotice(`Factura ${invoice.number}: ${status.toLowerCase()}`)
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const eliminarFactura = async invoice => {
    if (!window.confirm(`¿Eliminar la factura ${invoice.number}? Esta acción no se puede deshacer.`)) return
    setError('')
    try {
      await api.delete(`/taller/facturas/${invoice.id}`)
      setInvoices(current => current.filter(item => item.id !== invoice.id))
      setNotice(`Factura ${invoice.number} eliminada`)
      await cargarFacturacion()
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  return (
    <main className="billing-page">
      <header className="billing-header">
        <div>
          <span className="billing-eyebrow">ADMINISTRACIÓN · TALLER</span>
          <h1>Facturación</h1>
          <p>Emisión y seguimiento de cobros asociados a órdenes de trabajo.</p>
        </div>
        <button className="billing-refresh" type="button" onClick={cargarFacturacion} disabled={loading} title="Actualizar datos">
          <FiRefreshCw /> Actualizar
        </button>
      </header>

      {error && <div className="billing-message error" role="alert"><FiAlertCircle />{error}</div>}
      {notice && <div className="billing-message success" role="status"><FiCheck />{notice}</div>}

      <section className="billing-metrics" aria-label="Resumen de facturación">
        <div><span>Facturas emitidas</span><strong>{error ? '—' : invoices.length}</strong><small>{error ? 'Datos no disponibles' : 'Histórico registrado'}</small></div>
        <div><span>Por cobrar</span><strong>{error ? '—' : money(pendingTotal)}</strong><small>{error ? 'Datos no disponibles' : `${pendingInvoices.length} factura(s) pendiente(s)`}</small></div>
        <div><span>Cobrado</span><strong>{error ? '—' : money(paidTotal)}</strong><small>{error ? 'Datos no disponibles' : `${paidInvoices.length} factura(s) pagada(s)`}</small></div>
      </section>

      <section className="billing-content">
        <form className="billing-create" onSubmit={crearFactura}>
          <div className="billing-section-heading">
            <span className="billing-icon"><FiPlus /></span>
            <div><h2>Nueva factura</h2><p>Selecciona una orden que aún no tenga factura.</p></div>
          </div>
          {orders.length ? (
            <>
              <label htmlFor="billing-order">Orden de trabajo</label>
              <select id="billing-order" value={selectedOrderId} onChange={event => setSelectedOrderId(event.target.value)}>
                {orders.map(order => (
                  <option key={order.entryId} value={order.entryId}>
                    {order.entryNumber} · {order.plate} · {order.clientName}
                  </option>
                ))}
              </select>
              {selectedOrder && (
                <div className="billing-order-preview">
                  <div><small>CLIENTE</small><strong>{selectedOrder.clientName}</strong><span>RUT {selectedOrder.clientRut}</span></div>
                  <div><small>VEHÍCULO</small><strong>{selectedOrder.plate}</strong><span>{selectedOrder.brand} {selectedOrder.model}</span></div>
                  <div><small>ORDEN</small><strong>{selectedOrder.entryNumber}</strong><span>{selectedOrder.itemCount} conceptos · {dateLabel(selectedOrder.entryDate)}</span></div>
                  <div className="billing-order-total"><small>TOTAL</small><strong>{money(selectedOrder.total)}</strong></div>
                </div>
              )}
              <button className="billing-primary" type="submit" disabled={!selectedOrder || saving}>
                <FiFileText /> {saving ? 'Creando factura...' : 'Emitir factura'}
              </button>
            </>
          ) : (
            <div className="billing-empty-order">{error ? 'Órdenes no disponibles mientras falla la conexión con la base de datos.' : 'No hay órdenes con trabajos pendientes de facturar.'}</div>
          )}
        </form>

        <section className="billing-register" aria-labelledby="billing-register-title">
          <div className="billing-register-heading">
            <div><span className="billing-eyebrow">REGISTRO</span><h2 id="billing-register-title">Facturas</h2></div>
            <span className="billing-count">{visibleInvoices.length} resultados</span>
          </div>
          <div className="billing-filters">
            <label className="billing-search"><FiSearch /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar número, cliente u orden" /></label>
            <select aria-label="Filtrar por estado" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option>Todas</option><option>Pendiente de pago</option><option>Pagada</option><option>Anulada</option>
            </select>
          </div>

          {loading ? <div className="billing-empty">Cargando facturas desde la base de datos...</div> : (
            <div className="billing-table-wrap">
              <table className="billing-table">
                <thead><tr><th>Factura</th><th>Cliente / orden</th><th>Vehículo</th><th>Emisión</th><th>Estado</th><th>Total</th><th aria-label="Acciones" /></tr></thead>
                <tbody>
                  {visibleInvoices.map(invoice => {
                    const locked = ['Pagada', 'Anulada'].includes(invoice.status)
                    return (
                      <tr key={invoice.id}>
                        <td><strong>{invoice.number}</strong><small>{invoice.entryNumber}</small></td>
                        <td><strong>{invoice.clientName}</strong><small>{invoice.clientRut}</small></td>
                        <td><strong>{invoice.plate}</strong><small>{invoice.brand} {invoice.model}</small></td>
                        <td>{dateLabel(invoice.created)}</td>
                        <td>
                          <select className={`billing-status ${invoice.status === 'Pagada' ? 'paid' : invoice.status === 'Anulada' ? 'void' : 'pending'}`} aria-label={`Estado de ${invoice.number}`} value={invoice.status} disabled={locked} onChange={event => actualizarEstado(invoice, event.target.value)}>
                            <option>Pendiente de pago</option><option>Pagada</option><option>Anulada</option>
                          </select>
                        </td>
                        <td className="billing-amount">{money(invoice.total)}</td>
                        <td>{!locked && <button className="billing-delete" type="button" title={`Eliminar ${invoice.number}`} onClick={() => eliminarFactura(invoice)}><FiTrash2 /></button>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!error && !visibleInvoices.length && <div className="billing-empty">{invoices.length ? 'No hay facturas que coincidan con esos filtros.' : 'Todavía no hay facturas emitidas.'}</div>}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default Facturacion