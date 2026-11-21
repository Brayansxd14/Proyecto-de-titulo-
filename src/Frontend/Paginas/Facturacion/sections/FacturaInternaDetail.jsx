import { useState } from 'react'
import { FiDollarSign, FiPrinter, FiX } from 'react-icons/fi'

export default function FacturaInternaDetail({
  invoice,
  saving,
  error,
  formatMoney,
  formatDate,
  onClose,
  onAddPayment,
  onCancel,
}) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Transferencia')
  const [note, setNote] = useState('')

  const submitPayment = event => {
    event.preventDefault()
    onAddPayment({ amount: Number(amount), method, note })
    setAmount('')
    setNote('')
  }

  return (
    <div className="billing-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="billing-internal-document" role="dialog" aria-modal="true" aria-labelledby="internal-invoice-title">
        <div className="billing-modal-actions">
          <button type="button" onClick={() => window.print()}><FiPrinter /> Imprimir</button>
          {invoice.status !== 'Anulada' && (
            <button type="button" className="billing-cancel-action" disabled={saving} onClick={onCancel}>Anular</button>
          )}
          <button type="button" className="billing-close-action" onClick={onClose} aria-label="Cerrar"><FiX /></button>
        </div>

        <div className="billing-internal-banner">
          DOCUMENTO INTERNO · NO VÁLIDO COMO DOCUMENTO TRIBUTARIO · NO ENVIADO AL SII
        </div>
        {error && <div className="billing-message error" role="alert">{error}</div>}
        <header className="billing-document-heading">
          <div><span>GESTIÓN INTERNA DEL TALLER</span><h2 id="internal-invoice-title">Factura interna</h2></div>
          <div><strong>{invoice.number}</strong><span>Fecha: {formatDate(invoice.created)}</span></div>
        </header>

        <div className="billing-document-parties">
          <div><small>CLIENTE</small><strong>{invoice.clientName}</strong><span>RUT {invoice.clientRut}</span><span>{invoice.clientPhone || ''}</span></div>
          <div><small>ORDEN DE TRABAJO</small><strong>{invoice.entryNumber}</strong><span>{invoice.plate} · {invoice.brand} {invoice.model}</span><span>Fecha de orden: {formatDate(invoice.entryDate)}</span></div>
        </div>

        <div className="billing-table-wrap">
          <table className="billing-table billing-detail-table">
            <thead><tr><th>Tipo</th><th>Descripción</th><th>Cantidad</th><th>Precio unitario</th><th>Total</th></tr></thead>
            <tbody>{invoice.items.map(item => (
              <tr key={item.id}>
                <td>{item.type === 'labor' ? 'Mano de obra' : 'Repuesto'}</td>
                <td><strong>{item.name}</strong>{item.code && <small>{item.code}</small>}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.price)}</td>
                <td>{formatMoney(item.price * item.quantity)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="billing-document-totals">
          <div><span>Subtotal</span><strong>{formatMoney(invoice.subtotal)}</strong></div>
          <div><span>Descuento</span><strong>-{formatMoney(invoice.discount)}</strong></div>
          <div><span>IVA informativo ({invoice.taxRate}%)</span><strong>{formatMoney(invoice.tax)}</strong></div>
          <div className="grand-total"><span>Total interno</span><strong>{formatMoney(invoice.total)}</strong></div>
          <div><span>Pagado</span><strong>{formatMoney(invoice.amountPaid)}</strong></div>
          <div><span>Saldo pendiente</span><strong>{formatMoney(invoice.balance)}</strong></div>
        </div>
        <p className={`billing-document-status ${invoice.status === 'Anulada' ? 'void' : ''}`}>Estado: {invoice.status}</p>

        {invoice.status !== 'Anulada' && invoice.balance > 0 && (
          <form className="billing-payment-form" onSubmit={submitPayment}>
            <h3><FiDollarSign /> Registrar abono</h3>
            <label>Monto<input type="number" min="1" max={invoice.balance} step="1" required value={amount} onChange={event => setAmount(event.target.value)} /></label>
            <label>Medio de pago<select value={method} onChange={event => setMethod(event.target.value)}><option>Transferencia</option><option>Efectivo</option><option>Tarjeta</option><option>Otro</option></select></label>
            <label>Observación<input value={note} onChange={event => setNote(event.target.value)} maxLength="240" /></label>
            <button type="submit" disabled={saving || Number(amount) > invoice.balance}>{saving ? 'Guardando...' : 'Guardar abono'}</button>
          </form>
        )}

        <section className="billing-payment-history">
          <h3>Historial de pagos</h3>
          {invoice.payments.length ? invoice.payments.map(payment => (
            <div key={payment.id}><span>{formatDate(payment.date)} · {payment.method}{payment.note ? ` · ${payment.note}` : ''}</span><strong>{formatMoney(payment.amount)}</strong></div>
          )) : <p>Sin pagos registrados.</p>}
        </section>
      </section>
    </div>
  )
}
