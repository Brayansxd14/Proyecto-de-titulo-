import { useState } from "react";
import { FiFileText, FiPlus } from "react-icons/fi";

export default function NuevaFacturaSection({
  orders,
  selectedOrderId,
  selectedOrder,
  saving,
  hasError,
  onSelectOrder,
  onCreate,
  formatMoney,
  formatDate,
}) {
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const estimatedBase = Math.max(0, Number(selectedOrder?.total || 0) - Number(discount || 0));
  const estimatedTotal = estimatedBase * (1 + Number(taxRate || 0) / 100);

  const submitInvoice = (event) => {
    event.preventDefault();
    onCreate({ discount: Number(discount), taxRate: Number(taxRate) });
  };

  return (
    <form className="billing-create" onSubmit={submitInvoice}>
      <div className="billing-section-heading">
        <span className="billing-icon"><FiPlus /></span>
        <div><h2>Nueva factura interna</h2><p>Selecciona una orden que aún no tenga factura.</p></div>
      </div>
      {orders.length ? (
        <>
          <label htmlFor="billing-order">Orden de trabajo</label>
          <select id="billing-order" value={selectedOrderId} onChange={(event) => onSelectOrder(event.target.value)}>
            {orders.map((order) => (
              <option key={order.entryId} value={order.entryId}>
                {order.entryNumber} · {order.plate} · {order.clientName}
              </option>
            ))}
          </select>
          {selectedOrder && (
            <div className="billing-order-preview">
              <div><small>CLIENTE</small><strong>{selectedOrder.clientName}</strong><span>RUT {selectedOrder.clientRut}</span></div>
              <div><small>VEHÍCULO</small><strong>{selectedOrder.plate}</strong><span>{selectedOrder.brand} {selectedOrder.model}</span></div>
              <div><small>ORDEN</small><strong>{selectedOrder.entryNumber}</strong><span>{selectedOrder.itemCount} conceptos · {formatDate(selectedOrder.entryDate)}</span></div>
              <div className="billing-order-total"><small>TOTAL</small><strong>{formatMoney(selectedOrder.total)}</strong></div>
            </div>
          )}
          <div className="billing-invoice-options">
            <label>Descuento ($)
              <input type="number" min="0" max={selectedOrder?.total || 0} step="1" value={discount} onChange={(event) => setDiscount(event.target.value)} />
            </label>
            <label>IVA informativo (%)
              <input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} />
            </label>
          </div>
          <div className="billing-estimate"><span>Total estimado</span><strong>{formatMoney(estimatedTotal)}</strong></div>
          <button className="billing-primary" type="submit" disabled={!selectedOrder || saving || Number(discount) > Number(selectedOrder?.total || 0)}>
            <FiFileText /> {saving ? "Creando..." : "Crear factura interna"}
          </button>
          <p className="billing-internal-warning">Documento interno del sistema. No es una factura tributaria y no se envía al SII.</p>
        </>
      ) : (
        <div className="billing-empty-order">
          {hasError
            ? "Órdenes no disponibles mientras falla la conexión con la base de datos."
            : "No hay órdenes con trabajos pendientes de facturar."}
        </div>
      )}
    </form>
  );
}