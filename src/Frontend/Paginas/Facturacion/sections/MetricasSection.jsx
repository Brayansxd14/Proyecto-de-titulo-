export default function MetricasSection({
  hasError,
  invoiceCount,
  pendingTotal,
  pendingCount,
  paidTotal,
  paidCount,
  formatMoney,
}) {
  return (
    <section className="billing-metrics" aria-label="Resumen de facturación">
      <div>
        <span>Facturas emitidas</span>
        <strong>{hasError ? "—" : invoiceCount}</strong>
        <small>{hasError ? "Datos no disponibles" : "Histórico registrado"}</small>
      </div>
      <div>
        <span>Por cobrar</span>
        <strong>{hasError ? "—" : formatMoney(pendingTotal)}</strong>
        <small>{hasError ? "Datos no disponibles" : `${pendingCount} factura(s) pendiente(s)`}</small>
      </div>
      <div>
        <span>Cobrado</span>
        <strong>{hasError ? "—" : formatMoney(paidTotal)}</strong>
        <small>{hasError ? "Datos no disponibles" : `${paidCount} factura(s) pagada(s)`}</small>
      </div>
    </section>
  );
}