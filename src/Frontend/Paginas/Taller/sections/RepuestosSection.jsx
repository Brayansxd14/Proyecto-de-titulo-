import { FiTool } from "react-icons/fi";

export default function RepuestosSection({ parts, formatMoney }) {
  const availableCount = parts.filter((part) => Number(part.stock) > 0).length;
  const unavailableCount = parts.filter((part) => Number(part.stock) <= 0).length;

  return (
    <section className="panel parts-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INVENTARIO DEL TALLER</span>
          <h2>Registro de repuestos</h2>
          <p className="panel-description">
            Consulta todos los repuestos registrados, tanto los nuevos como los
            que ya no tienen stock.
          </p>
        </div>
        <span className="count-label">{parts.length} registrados</span>
      </div>
      <div className="parts-summary">
        <div>
          <strong>{availableCount}</strong>
          <span>Con stock</span>
        </div>
        <div>
          <strong>{unavailableCount}</strong>
          <span>Sin stock / cerrados</span>
        </div>
      </div>
      <div className="parts-table-wrap">
        <table className="parts-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Repuesto</th>
              <th>Tipo</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => (
              <tr key={part.id}>
                <td>{part.code}</td>
                <td>
                  <strong>{part.name}</strong>
                </td>
                <td>{part.type || "Sin tipo"}</td>
                <td>{formatMoney(part.price)}</td>
                <td>{part.stock}</td>
                <td>
                  <span
                    className={`inventory-status ${Number(part.stock) > 0 ? "available" : "closed"}`}
                  >
                    {Number(part.stock) > 0 ? "Disponible" : "Sin stock"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {parts.length === 0 && (
          <div className="empty-state">
            <FiTool />
            <strong>No hay repuestos registrados</strong>
            <span>Agrega repuestos desde el módulo Inventario.</span>
          </div>
        )}
      </div>
    </section>
  );
}