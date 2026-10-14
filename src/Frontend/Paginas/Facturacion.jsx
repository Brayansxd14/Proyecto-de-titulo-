import { useEffect, useState } from 'react'
import { FiAlertCircle, FiCheck, FiRefreshCw } from 'react-icons/fi'
import api from '../services/api'
import '../styles/Facturacion.css'
import MetricasSection from './Facturacion/sections/MetricasSection.jsx'
import NuevaFacturaSection from './Facturacion/sections/NuevaFacturaSection.jsx'
import ListaFacturasSection from './Facturacion/sections/ListaFacturasSection.jsx'

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

      <MetricasSection
        hasError={Boolean(error)}
        invoiceCount={invoices.length}
        pendingTotal={pendingTotal}
        pendingCount={pendingInvoices.length}
        paidTotal={paidTotal}
        paidCount={paidInvoices.length}
        formatMoney={money}
      />

      <section className="billing-content">
        <NuevaFacturaSection
          orders={orders}
          selectedOrderId={selectedOrderId}
          selectedOrder={selectedOrder}
          saving={saving}
          hasError={Boolean(error)}
          onSelectOrder={setSelectedOrderId}
          onCreate={crearFactura}
          formatMoney={money}
          formatDate={dateLabel}
        />
        <ListaFacturasSection
          visibleInvoices={visibleInvoices}
          invoiceCount={invoices.length}
          loading={loading}
          hasError={Boolean(error)}
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onUpdateStatus={actualizarEstado}
          onDelete={eliminarFactura}
          formatMoney={money}
          formatDate={dateLabel}
        />
      </section>
    </main>
  )
}

export default Facturacion