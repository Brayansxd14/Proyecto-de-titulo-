import { FiPrinter, FiX } from "react-icons/fi";

export default function PresupuestosSection({
  quotes,
  entries,
  formatMoney,
  selectedQuoteId,
  onViewQuote,
  onRemove,
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PROPUESTAS COMERCIALES</span>
          <h2>Presupuestos</h2>
        </div>
        <span className="count-label">{quotes.length} creados</span>
      </div>
      <div className="quote-list">
        {quotes.map((quote) => {
          const entry = entries.find((item) => item.id === quote.entryId);

          return (
            <div className="quote-row" key={quote.id}>
              <div>
                <b>{quote.number}</b>
                <span>
                  {entry?.number || "Ingreso eliminado"} · {entry?.plate || "Sin patente"}
                </span>
              </div>
              <span className="status-chip">{quote.status}</span>
              <strong>{formatMoney(quote.total)}</strong>
              <button
                className={`icon-button ${selectedQuoteId === quote.id ? "active" : ""}`}
                title="Ver e imprimir presupuesto"
                aria-label={`Ver presupuesto ${quote.number}`}
                onClick={() => onViewQuote(quote.id)}
              >
                <FiPrinter />
              </button>
              <button
                className="icon-button danger"
                title="Eliminar presupuesto"
                onClick={() => onRemove(quote, "presupuestos")}
              >
                <FiX />
              </button>
            </div>
          );
        })}
        {quotes.length === 0 && (
          <div className="empty-state">
            <FiPrinter />
            <strong>No hay presupuestos</strong>
            <span>Selecciona un ingreso y crea su primer presupuesto.</span>
          </div>
        )}
      </div>
    </section>
  );
}