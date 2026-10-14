export default function ImportarSection({ importResult, onImport }) {
  return (
    <>
      <form className="proveedores-import-form" onSubmit={onImport}>
        <div>
          <strong>Importar proveedores</strong>
          <small>Columnas: nombre, rut, contacto, telefono, email, direccion y estado.</small>
        </div>
        <input name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
        <button type="submit">Subir Excel o CSV</button>
      </form>
      {importResult && (
        <div className="proveedores-import-result">
          {importResult.message ? (
            <strong>{importResult.message}</strong>
          ) : (
            <>
              <strong>{importResult.imported} importado(s)</strong>
              <span>{importResult.rejected} rechazado(s)</span>
              {importResult.errors?.length > 0 && (
                <ul>
                  {importResult.errors.map((error) => (
                    <li key={error.fila}>Fila {error.fila}: {error.motivo}</li>
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