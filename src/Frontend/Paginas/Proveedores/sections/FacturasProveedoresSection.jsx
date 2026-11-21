import { Fragment, useEffect, useMemo, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import api from '../../../services/api'

const newItem = () => ({ code: '', name: '', type: 'otro', quantity: '1', price: '0' })
const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`
const localDate = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

export default function FacturasProveedoresSection({ providers }) {
  const [invoices, setInvoices] = useState([])
  const [providerId, setProviderId] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [issueDate, setIssueDate] = useState(localDate)
  const [discount, setDiscount] = useState('0')
  const [taxRate, setTaxRate] = useState('0')
  const [items, setItems] = useState([newItem()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [expandedInvoice, setExpandedInvoice] = useState(null)

  const activeProviders = providers.filter(provider => provider.estado === 'Activo')
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0),
    [items]
  )
  const taxable = Math.max(0, subtotal - (Number(discount) || 0))
  const total = taxable * (1 + (Number(taxRate) || 0) / 100)

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/proveedores/facturas')
      setInvoices(data)
      setError('')
    } catch {
      setError('No se pudieron cargar las facturas de proveedores.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    api.get('/proveedores/facturas')
      .then(({ data }) => { if (active) setInvoices(data) })
      .catch(() => { if (active) setError('No se pudieron cargar las facturas de proveedores.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const updateItem = (index, field, value) => {
    setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  const saveInvoice = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const { data } = await api.post('/proveedores/facturas', {
        providerId: Number(providerId),
        documentNumber,
        issueDate,
        discount: Number(discount),
        taxRate: Number(taxRate),
        items: items.map(item => ({
          code: item.code.trim(),
          name: item.name.trim(),
          type: item.type,
          quantity: Number(item.quantity),
          price: Number(item.price)
        }))
      })
      setInvoices(current => [data, ...current])
      setDocumentNumber('')
      setItems([newItem()])
      setDiscount('0')
      setTaxRate('0')
      setNotice(`Factura ${data.documentNumber} registrada; ${data.itemCount} repuesto(s) recibidos en inventario.`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo registrar la factura ni recibir sus repuestos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="provider-invoices" aria-labelledby="provider-invoices-title">
      <div className="provider-invoices-heading">
        <div><span>COMPRAS E INVENTARIO</span><h2 id="provider-invoices-title">Facturas de proveedores</h2></div>
        <p>Al registrar una factura, los repuestos se reciben en stock en la misma operación.</p>
      </div>

      {error && <div className="provider-invoice-message error" role="alert">{error}<button type="button" onClick={loadInvoices} disabled={loading}>Reintentar</button></div>}
      {notice && <div className="provider-invoice-message success" role="status">{notice}</div>}
      {!activeProviders.length && <div className="provider-invoice-message">Primero registra un proveedor activo para recibir compras.</div>}

      <form className="provider-invoice-form" onSubmit={saveInvoice}>
        <div className="provider-invoice-fields">
          <label>Proveedor<select required value={providerId} onChange={event => setProviderId(event.target.value)}>
            <option value="">Selecciona proveedor</option>
            {activeProviders.map(provider => <option key={provider.id} value={provider.id}>{provider.nombre}</option>)}
          </select></label>
          <label>Número de factura<input required maxLength="80" value={documentNumber} onChange={event => setDocumentNumber(event.target.value)} /></label>
          <label>Fecha de emisión<input type="date" required value={issueDate} onChange={event => setIssueDate(event.target.value)} /></label>
          <label>Descuento ($)<input type="number" min="0" step="1" max={subtotal} value={discount} onChange={event => setDiscount(event.target.value)} /></label>
          <label>IVA informativo (%)<input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={event => setTaxRate(event.target.value)} /></label>
        </div>

        <div className="provider-invoice-items-heading"><h3>Repuestos recibidos</h3><button type="button" onClick={() => setItems(current => [...current, newItem()])}><FiPlus /> Agregar repuesto</button></div>
        <div className="provider-invoice-items">
          {items.map((item, index) => (
            <div className="provider-invoice-item" key={index}>
              <label>Código / SKU<input required maxLength="50" value={item.code} onChange={event => updateItem(index, 'code', event.target.value)} /></label>
              <label>Nombre<input required maxLength="100" value={item.name} onChange={event => updateItem(index, 'name', event.target.value)} /></label>
              <label>Tipo<input required maxLength="50" value={item.type} onChange={event => updateItem(index, 'type', event.target.value)} /></label>
              <label>Cantidad<input type="number" min="1" step="1" required value={item.quantity} onChange={event => updateItem(index, 'quantity', event.target.value)} /></label>
              <label>Costo unitario<input type="number" min="0" step="1" required value={item.price} onChange={event => updateItem(index, 'price', event.target.value)} /></label>
              <strong>{money(Number(item.quantity) * Number(item.price))}</strong>
              <button type="button" aria-label="Quitar repuesto" disabled={items.length === 1} onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))}><FiTrash2 /></button>
            </div>
          ))}
        </div>
        <div className="provider-invoice-summary"><span>Subtotal {money(subtotal)}</span><span>Descuento −{money(discount)}</span><span>IVA informativo {money(taxable * (Number(taxRate) || 0) / 100)}</span><strong>Total {money(total)}</strong></div>
        <p className="provider-invoice-note">Registro interno de compra. El costo se guarda por separado del precio de venta; si el código ya existe, se suma la cantidad y se actualiza el costo sin cambiar el precio de venta. Revisa y define el precio de venta de los productos nuevos en Inventario antes de facturarlos a clientes.</p>
        <button className="provider-invoice-submit" type="submit" disabled={saving || !activeProviders.length || Number(discount) > subtotal}>{saving ? 'Registrando y recibiendo...' : 'Registrar factura y recibir repuestos'}</button>
      </form>

      <div className="provider-invoice-history">
        <h3>Historial de compras</h3>
        {loading ? <p>Cargando facturas...</p> : invoices.length ? (
          <div className="proveedores-table-wrapper"><table>
            <thead><tr><th>Factura</th><th>Proveedor</th><th>Fecha</th><th>Repuestos</th><th>Total</th></tr></thead>
            <tbody>{invoices.map(invoice => (
              <Fragment key={invoice.id}>
                <tr>
                  <td><button className="provider-invoice-number" type="button" aria-expanded={expandedInvoice === invoice.id} onClick={() => setExpandedInvoice(current => current === invoice.id ? null : invoice.id)}>{invoice.documentNumber}</button></td>
                  <td>{invoice.providerName}</td><td>{String(invoice.issueDate).slice(0, 10)}</td><td>{invoice.itemCount}</td><td>{money(invoice.total)}</td>
                </tr>
                {expandedInvoice === invoice.id && <tr><td colSpan="5"><ul>{invoice.items.map(item => <li key={`${invoice.id}-${item.code}`}>{item.code} · {item.name} — {item.quantity} × {money(item.price)}</li>)}</ul></td></tr>}
              </Fragment>
            ))}</tbody>
          </table></div>
        ) : <p>Aún no hay facturas de proveedores registradas.</p>}
      </div>
    </section>
  )
}
