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
  return (
    <form className="billing-create" onSubmit={onCreate}>
      <div className="billing-section-heading">
        <span className="billing-icon"><FiPlus /></span>
        <div><h2>Nueva factura</h2><p>Selecciona una orden que aún no tenga factura.</p></div>
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
          <button className="billing-primary" type="submit" disabled={!selectedOrder || saving}>
            <FiFileText /> {saving ? "Creando factura..." : "Emitir factura"}
          </button>
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