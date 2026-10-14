export default function ProductosTableSection({
  productos,
  onEdit,
  onDelete,
}) {
  return (
    <>
      <h3>Lista de repuestos</h3>
      <div className="inventario-table-wrapper">
        <table className="inventario-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Repuesto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Proveedor</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.numero_serie}>
                <td><strong>{producto.numero_serie}</strong></td>
                <td>{producto.nombre}</td>
                <td>{producto.tipo || "-"}</td>
                <td>{producto.cantidad}</td>
                <td>${Number(producto.precio || 0).toLocaleString("es-CL")}</td>
                <td>{producto.proveedor || "-"}</td>
                <td>
                  <span className={`inventario-status ${producto.estado === "con stock" ? "available" : "empty"}`}>
                    {producto.estado}
                  </span>
                </td>
                <td>
                  <div className="inventario-item-actions">
                    <button className="inventario-edit-button" onClick={() => onEdit(producto)}>Editar</button>
                    <button className="inventario-delete-button" onClick={() => onDelete(producto.numero_serie)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productos.length === 0 && (
          <p className="inventario-empty">No hay repuestos registrados.</p>
        )}
      </div>
    </>
  );
}