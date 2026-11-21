import { useEffect, useState } from 'react'
import { FiAlertCircle, FiCheck, FiRefreshCw } from 'react-icons/fi'
import api from '../services/api'
import '../styles/Facturacion.css'
import MetricasSection from './Facturacion/sections/MetricasSection.jsx'
import NuevaFacturaSection from './Facturacion/sections/NuevaFacturaSection.jsx'
import ListaFacturasSection from './Facturacion/sections/ListaFacturasSection.jsx'
import FacturaInternaDetail from './Facturacion/sections/FacturaInternaDetail.jsx'
import FacturaElectronicaSection from './Facturacion/sections/FacturaElectronicaSection.jsx'
import { useSearchParams } from 'react-router-dom'

const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`
const dateLabel = value => value ? String(value).slice(0, 10).split('-').reverse().join('/') : 'Sin fecha'

const errorMessage = error => {
  const message = error.response?.data?.error || error.response?.data || error.message
  return typeof message === 'string' ? message : 'No se pudo completar la operación'
}

function Facturacion() {
  const [searchParams] = useSearchParams()
  const requestedOrderId = searchParams.get('orden') || ''
  const [invoices, setInvoices] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [siiStatus, setSiiStatus] = useState(null)
  const [siiLoading, setSiiLoading] = useState(true)
  const [siiError, setSiiError] = useState('')

  const cargarEstadoSii = async () => {
    setSiiLoading(true)
    setSiiError('')
    try {
      const { data } = await api.get('/facturacion/sii/estado')
      setSiiStatus(data)
    } catch (requestError) {
      setSiiError(errorMessage(requestError))
    } finally {
      setSiiLoading(false)
    }
  }

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
          : data.orders.some(order => String(order.entryId) === requestedOrderId)
            ? requestedOrderId
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
        setSelectedOrderId(
          data.orders.some(order => String(order.entryId) === requestedOrderId)
            ? requestedOrderId
            : String(data.orders[0]?.entryId || '')
        )
      })
      .catch(requestError => {
        if (active) setError(errorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [requestedOrderId])

  useEffect(() => {
    let active = true
    api.get('/facturacion/sii/estado')
      .then(({ data }) => {
        if (active) setSiiStatus(data)
      })
      .catch(requestError => {
        if (active) setSiiError(errorMessage(requestError))
      })
      .finally(() => {
        if (active) setSiiLoading(false)
      })

    return () => { active = false }
  }, [])

  const selectedOrder = orders.find(order => String(order.entryId) === selectedOrderId)
  const pendingInvoices = invoices.filter(invoice => !['Pagada', 'Anulada'].includes(invoice.status))
  const paidInvoices = invoices.filter(invoice => invoice.status === 'Pagada')
  const pendingTotal = pendingInvoices.reduce((sum, invoice) => sum + Number(invoice.balance), 0)
  const paidTotal = invoices.filter(invoice => invoice.status !== 'Anulada')
    .reduce((sum, invoice) => sum + Number(invoice.amountPaid), 0)
  const visibleInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'Todas' || invoice.status === statusFilter
    const query = search.trim().toLowerCase()
    const haystack = `${invoice.number} ${invoice.entryNumber} ${invoice.plate} ${invoice.clientName} ${invoice.clientRut}`.toLowerCase()
    return matchesStatus && (!query || haystack.includes(query))
  })

  const cargarDetalle = async invoice => {
    setError('')
    try {
      const { data } = await api.get(`/facturacion/${invoice.id}`)
      setSelectedInvoice(data)
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const crearFactura = async options => {
    if (!selectedOrder) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const { data } = await api.post(`/facturacion/ordenes/${selectedOrder.entryId}/factura`, options)
      setNotice(`Factura creada para la orden ${selectedOrder.entryNumber}`)
      await cargarFacturacion()
      await cargarDetalle(data)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const registrarPago = async payment => {
    if (!selectedInvoice) return
    setSaving(true)
    setError('')
    try {
      await api.post(`/facturacion/${selectedInvoice.id}/pagos`, payment)
      setNotice(`Abono registrado para la factura ${selectedInvoice.number}`)
      await cargarFacturacion()
      await cargarDetalle(selectedInvoice)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const anularFactura = async invoice => {
    if (!window.confirm(`¿Anular la factura ${invoice.number}? Se conservarán la factura y sus pagos en el historial.`)) return
    setSaving(true)
    setError('')
    try {
      await api.patch(`/facturacion/${invoice.id}/anular`)
      setNotice(`Factura ${invoice.number} anulada; el historial se conservó`)
      await cargarFacturacion()
      if (selectedInvoice?.id === invoice.id) await cargarDetalle(invoice)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="billing-page">
      <header className="billing-header">
        <div>
          <span className="billing-eyebrow">ADMINISTRACIÓN · TALLER</span>
          <h1>Facturación interna</h1>
          <p>Control de cobros y pagos del taller, sin emisión tributaria ni envío al SII.</p>
        </div>
        <button
          className="billing-refresh"
          type="button"
          onClick={() => {
            cargarFacturacion()
            cargarEstadoSii()
          }}
          disabled={loading || siiLoading}
          title="Actualizar datos"
        >
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
          onView={cargarDetalle}
          onCancel={anularFactura}
          formatMoney={money}
          formatDate={dateLabel}
        />
      </section>

      <FacturaElectronicaSection
        status={siiStatus}
        loading={siiLoading}
        error={siiError}
      />

      {selectedInvoice && (
        <FacturaInternaDetail
          invoice={selectedInvoice}
          saving={saving}
          error={error}
          formatMoney={money}
          formatDate={dateLabel}
          onClose={() => setSelectedInvoice(null)}
          onAddPayment={registrarPago}
          onCancel={() => anularFactura(selectedInvoice)}
        />
      )}
    </main>
  )
}

export default Facturacion