export default function BuscarRepuestoSection({
  filtros,
  proveedores,
  onFilterChange,
  onSearch,
  onShowAll,
}) {
  return (
    <form onSubmit={onSearch} className="inventario-form">
      <input placeholder="Número de serie" value={filtros.numero_serie} onChange={(event) => onFilterChange("numero_serie", event.target.value)} />
      <input placeholder="Nombre" value={filtros.nombre} onChange={(event) => onFilterChange("nombre", event.target.value)} />
      <select value={filtros.proveedor} onChange={(event) => onFilterChange("proveedor", event.target.value)}>
        <option value="">Cualquier proveedor</option>
        {proveedores.map((proveedor) => (
          <option key={proveedor.id} value={proveedor.nombre}>{proveedor.nombre}</option>
        ))}
      </select>
      <select value={filtros.tipo} onChange={(event) => onFilterChange("tipo", event.target.value)}>
        <option value="">Cualquier tipo</option>
        <option value="Motor">Motor</option>
        <option value="Frenos">Frenos</option>
        <option value="Suspensión">Suspensión</option>
        <option value="Eléctrico">Eléctrico</option>
      </select>
      <select value={filtros.estado} onChange={(event) => onFilterChange("estado", event.target.value)}>
        <option value="">Cualquier estado</option>
        <option value="con stock">Con stock</option>
        <option value="sin stock">Sin stock</option>
      </select>
      <input type="number" min="0" placeholder="Cantidad mínima" value={filtros.cantidadMin} onChange={(event) => onFilterChange("cantidadMin", event.target.value)} />
      <input type="number" min="0" placeholder="Cantidad máxima" value={filtros.cantidadMax} onChange={(event) => onFilterChange("cantidadMax", event.target.value)} />
      <button type="submit">Buscar repuestos</button>
      <button type="button" onClick={onShowAll}>Mostrar todo</button>
    </form>
  );
}