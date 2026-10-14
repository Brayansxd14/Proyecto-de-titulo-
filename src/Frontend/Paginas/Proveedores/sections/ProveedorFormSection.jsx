export default function ProveedorFormSection({
  form,
  editing,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form className="proveedores-form" onSubmit={onSubmit}>
      <input name="nombre" placeholder="Nombre del proveedor" value={form.nombre} onChange={onChange} required />
      <input name="rut" placeholder="RUT" value={form.rut} onChange={onChange} />
      <input name="contacto" placeholder="Persona de contacto" value={form.contacto} onChange={onChange} />
      <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={onChange} />
      <input name="email" type="email" placeholder="Correo electrónico" value={form.email} onChange={onChange} />
      <input name="direccion" placeholder="Dirección" value={form.direccion} onChange={onChange} />
      <select name="estado" value={form.estado} onChange={onChange}>
        <option value="Activo">Activo</option>
        <option value="Inactivo">Inactivo</option>
      </select>
      <button type="submit">{editing ? "Guardar cambios" : "Agregar proveedor"}</button>
      {editing && <button type="button" onClick={onCancel}>Cancelar</button>}
    </form>
  );
}