export default function AccionesSection({
  activeForm,
  onToggleForm,
  importResult,
  onImport,
}) {
  return (
    <>
      <div className="inventario-botones">
        <button onClick={() => onToggleForm("agregar")}>
          {activeForm === "agregar" ? "Ocultar formulario de agregar" : "Agregar repuesto"}
        </button>
        <button onClick={() => onToggleForm("buscar")}>
          {activeForm === "buscar" ? "Ocultar formulario de búsqueda" : "Buscar repuesto"}
        </button>
        <button onClick={() => onToggleForm("reporte")}>
          {activeForm === "reporte" ? "Ocultar reporte" : "Generar reporte"}
        </button>
        <button onClick={() => onToggleForm("importar")}>
          {activeForm === "importar" ? "Ocultar importación" : "Importar Excel o CSV"}
        </button>
      </div>

      {activeForm === "importar" && (
        <form onSubmit={onImport} className="inventario-import-form">
          <div>
            <strong>Carga masiva de inventario</strong>
            <small>
              Columnas: numero_serie o codigo, nombre, cantidad, precio, tipo y proveedor.
            </small>
          </div>
          <input name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
          <button type="submit">Subir datos</button>
        </form>
      )}

      {importResult && (
        <div className="inventario-import-result">
          {importResult.message ? (
            <strong>{importResult.message}</strong>
          ) : (
            <>
              <strong>{importResult.imported} fila(s) importada(s)</strong>
              <span>{importResult.rejected} fila(s) rechazada(s)</span>
              {importResult.errors?.length > 0 && (
                <ul>
                  {importResult.errors.map((error) => (
                    <li key={error.fila}>
                      Fila {error.fila}: {error.motivo}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}