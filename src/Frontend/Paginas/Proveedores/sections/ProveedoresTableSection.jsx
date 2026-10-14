export default function ProveedoresTableSection({
  proveedores,
  cargando,
  errorCarga,
  onEdit,
  onDelete,
}) {
  return (
    <div className="proveedores-table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>RUT</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map((proveedor) => (
            <tr key={proveedor.id}>
              <td>{proveedor.nombre}</td>
              <td>{proveedor.rut || "-"}</td>
              <td>{proveedor.contacto || "-"}</td>
              <td>{proveedor.telefono || "-"}</td>
              <td>{proveedor.email || "-"}</td>
              <td>{proveedor.estado}</td>
              <td className="proveedores-actions">
                <button type="button" onClick={() => onEdit(proveedor)}>Editar</button>
                <button type="button" onClick={() => onDelete(proveedor.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {cargando && <p>Cargando proveedores...</p>}
      {!cargando && !errorCarga && proveedores.length === 0 && (
        <p>No hay proveedores registrados.</p>
      )}
    </div>
  );
}