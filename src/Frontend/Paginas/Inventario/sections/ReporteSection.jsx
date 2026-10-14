export default function ReporteSection({
  filtros,
  proveedores,
  reporte,
  onFilterChange,
  onGenerate,
}) {
  return (
    <>
      <form onSubmit={onGenerate} className="inventario-reporte">
        <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={(event) => onFilterChange("fechaInicio", event.target.value)} />
        <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={(event) => onFilterChange("fechaFin", event.target.value)} />
        <select name="proveedor" value={filtros.proveedor} onChange={(event) => onFilterChange("proveedor", event.target.value)}>
          <option value="">Cualquier proveedor</option>
          {proveedores.map((proveedor) => (
            <option key={proveedor.id} value={proveedor.nombre}>{proveedor.nombre}</option>
          ))}
        </select>
        <button type="submit">Generar Reporte</button>
      </form>

      {reporte.length > 0 && (
        <div>
          <h3>Reporte de salidas</h3>
          <table>
            <thead>
              <tr>
                <th>Repuesto</th>
                <th>Proveedor</th>
                <th>Total Salidas</th>
              </tr>
            </thead>
            <tbody>
              {reporte.map((item, index) => (
                <tr key={index}>
                  <td>{item.repuesto}</td>
                  <td>{item.proveedor}</td>
                  <td>{item.total_salidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}