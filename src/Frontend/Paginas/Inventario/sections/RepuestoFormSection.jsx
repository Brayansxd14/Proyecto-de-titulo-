export default function RepuestoFormSection({
  form,
  proveedores,
  editando,
  onChange,
  onSubmit,
  onClear,
}) {
  return (
    <form onSubmit={onSubmit} className="inventario-form">
      <input name="numero_serie" placeholder="Número de serie" value={form.numero_serie} onChange={onChange} disabled={Boolean(editando)} required />
      <input name="nombre" placeholder="Nombre del repuesto" value={form.nombre} onChange={onChange} required />
      <input name="cantidad" type="number" min="0" placeholder="Cantidad" value={form.cantidad} onChange={onChange} required />
      <input name="precio" type="number" min="0" step="0.01" placeholder="Precio" value={form.precio} onChange={onChange} required />
      <select name="tipo" value={form.tipo} onChange={onChange} required>
        <option value="">Selecciona tipo</option>
        <option value="Motor">Motor</option>
        <option value="Frenos">Frenos</option>
        <option value="Suspensión">Suspensión</option>
        <option value="Eléctrico">Eléctrico</option>
        <option value="otro">Otro</option>
      </select>
      {form.tipo === "otro" && (
        <input name="tipoOtro" placeholder="Especifica el tipo" value={form.tipoOtro} onChange={onChange} required />
      )}
      <select name="proveedor" value={form.proveedor} onChange={onChange}>
        <option value="">Selecciona proveedor</option>
        {proveedores.map((proveedor) => (
          <option key={proveedor.id} value={proveedor.nombre}>{proveedor.nombre}</option>
        ))}
        <option value="otro">Otro proveedor</option>
      </select>
      {form.proveedor === "otro" && (
        <input name="proveedorOtro" placeholder="Nombre del nuevo proveedor" value={form.proveedorOtro} onChange={onChange} required />
      )}
      <button type="submit">{editando ? "Guardar cambios" : "Agregar repuesto"}</button>
      {editando && <button type="button" onClick={onClear}>Cancelar</button>}
    </form>
  );
}