import { FiPrinter, FiX } from "react-icons/fi";

export default function OrdenItemsSection({
  selectedEntry,
  itemDraft,
  onUpdateItemDraft,
  onSaveItemDraft,
  onRemoveItem,
  onPrint,
  formatMoney,
}) {
  return (
    <section className="panel item-management-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">EDICIÓN DE ÍTEMS</span>
          <h2>Modificar o eliminar trabajos</h2>
          <p className="panel-description">
            Puedes cambiar el precio, las horas o la cantidad de cada elemento.
          </p>
        </div>
        <button className="primary-button" onClick={onPrint}>
          <FiPrinter /> Imprimir orden
        </button>
      </div>
      <div className="managed-items">
        {selectedEntry.items.map((item) => (
          <div className="managed-item" key={item.itemId}>
            <div className="managed-item-name">
              <strong>{item.name}</strong>
              <small>
                {item.code || "Sin código"} · {item.type === "labor" ? "Mano de obra" : "Repuesto"}
              </small>
            </div>
            <label>
              Precio
              <input
                type="number"
                min="0"
                value={itemDraft(item).price}
                onChange={(event) => onUpdateItemDraft(item, "price", event.target.value)}
                onBlur={() => onSaveItemDraft(item)}
              />
            </label>
            <label>
              {item.type === "labor" ? "Horas" : "Cantidad"}
              <input
                type="number"
                min={item.type === "labor" ? "0.25" : "1"}
                step={item.type === "labor" ? "0.25" : "1"}
                value={itemDraft(item).quantity}
                onChange={(event) => onUpdateItemDraft(item, "quantity", event.target.value)}
                onBlur={() => onSaveItemDraft(item)}
              />
            </label>
            <strong className="managed-total">{formatMoney(Number(item.price) * Number(item.quantity))}</strong>
            <button type="button" className="icon-button danger" title="Eliminar ítem" onClick={() => onRemoveItem(item.itemId)}>
              <FiX />
            </button>
          </div>
        ))}
        {selectedEntry.items.length === 0 && (
          <div className="empty-inline">No hay ítems agregados a esta orden.</div>
        )}
      </div>
    </section>
  );
}