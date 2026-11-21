import { FiEye, FiSearch, FiSlash } from "react-icons/fi";

export default function ListaFacturasSection({
  visibleInvoices,
  invoiceCount,
  loading,
  hasError,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onView,
  onCancel,
  formatMoney,
  formatDate,
}) {
  return (
    <section className="billing-register" aria-labelledby="billing-register-title">
      <div className="billing-register-heading">
        <div><span className="billing-eyebrow">REGISTRO</span><h2 id="billing-register-title">Facturas</h2></div>
        <span className="billing-count">{visibleInvoices.length} resultados</span>
      </div>
      <div className="billing-filters">
        <label className="billing-search">
          <FiSearch />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar número, cliente u orden" />
        </label>
        <select aria-label="Filtrar por estado" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
          <option>Todas</option><option>Pendiente de pago</option><option>Abonada</option><option>Pagada</option><option>Anulada</option>
        </select>
      </div>

      {loading ? (
        <div className="billing-empty">Cargando facturas desde la base de datos...</div>
      ) : (
        <div className="billing-table-wrap">
          <table className="billing-table">
            <thead><tr><th>Factura</th><th>Cliente / orden</th><th>Vehículo</th><th>Emisión</th><th>Estado</th><th>Total</th><th aria-label="Acciones" /></tr></thead>
            <tbody>
              {visibleInvoices.map((invoice) => {
                return (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.number}</strong><small>{invoice.entryNumber}</small></td>
                    <td><strong>{invoice.clientName}</strong><small>{invoice.clientRut}</small></td>
                    <td><strong>{invoice.plate}</strong><small>{invoice.brand} {invoice.model}</small></td>
                    <td>{formatDate(invoice.created)}</td>
                    <td><span className={`billing-status-label ${invoice.status === "Pagada" ? "paid" : invoice.status === "Anulada" ? "void" : "pending"}`}>{invoice.status}</span><small>Saldo {formatMoney(invoice.balance)}</small></td>
                    <td className="billing-amount">{formatMoney(invoice.total)}</td>
                    <td className="billing-row-actions">
                      <button type="button" title={`Ver factura ${invoice.number}`} onClick={() => onView(invoice)}><FiEye /></button>
                      {invoice.status !== "Anulada" && <button type="button" className="cancel" title={`Anular ${invoice.number}`} onClick={() => onCancel(invoice)}><FiSlash /></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!hasError && !visibleInvoices.length && (
            <div className="billing-empty">
              {invoiceCount ? "No hay facturas que coincidan con esos filtros." : "Todavía no hay facturas emitidas."}
            </div>
          )}
        </div>
      )}
    </section>
  );
}