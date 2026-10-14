import { useState } from "react";
import { FiChevronRight, FiEdit3, FiX } from "react-icons/fi";

function InvoiceRow({ invoice, entry, onOpen, onUpdate, onRemove }) {
  const locked = ["Pagada", "Anulada"].includes(invoice.status);
  const [total, setTotal] = useState(String(invoice.total ?? 0));
  const saveTotal = () => onUpdate(invoice, { total: Number(total) || 0 });

  return (
    <div className="quote-row invoice-row">
      <div>
        <b>{invoice.number}</b>
        <span>
          {entry?.number || "Ingreso eliminado"} · {entry?.plate || "Sin patente"}
        </span>
      </div>
      <label className="invoice-field">
        Estado
        <select
          value={invoice.status}
          disabled={locked}
          onChange={(event) => onUpdate(invoice, { status: event.target.value })}
        >
          <option>Pendiente de pago</option>
          <option>Pagada</option>
          <option>Anulada</option>
        </select>
      </label>
      <label className="invoice-field">
        Total
        <input
          type="number"
          min="0"
          value={total}
          disabled={locked}
          onChange={(event) => setTotal(event.target.value)}
          onBlur={saveTotal}
        />
      </label>
      <button className="icon-button" title="Abrir orden" onClick={onOpen}>
        <FiChevronRight />
      </button>
      {!locked && (
        <button
          className="icon-button danger"
          title="Eliminar factura"
          onClick={() => onRemove(invoice, "facturas")}
        >
          <FiX />
        </button>
      )}
    </div>
  );
}

export default function FacturasSection({
  invoices,
  entries,
  onUpdate,
  onOpen,
  onRemove,
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">COBRANZAS</span>
          <h2>Facturas</h2>
        </div>
        <span className="count-label">{invoices.length} emitidas</span>
      </div>
      <div className="quote-list">
        {invoices.map((invoice) => (
          <InvoiceRow
            key={invoice.id}
            invoice={invoice}
            entry={entries.find((item) => item.id === invoice.entryId)}
            onUpdate={onUpdate}
            onOpen={() => onOpen(invoice.entryId)}
            onRemove={onRemove}
          />
        ))}
        {invoices.length === 0 && (
          <div className="empty-state">
            <FiEdit3 />
            <strong>No hay facturas</strong>
            <span>Agrega trabajos a una orden y pulsa Facturar.</span>
          </div>
        )}
      </div>
    </section>
  );
}