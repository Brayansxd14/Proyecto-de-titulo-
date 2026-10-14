import { FiPlus, FiTruck, FiUser } from "react-icons/fi";

function ImportResult({ result }) {
  if (!result) return null;

  return (
    <div className="taller-import-result">
      {result.message ? (
        <strong>{result.message}</strong>
      ) : (
        <>
          <strong>{result.imported} importado(s)</strong>
          <span>{result.rejected} rechazado(s)</span>
          {result.errors?.length > 0 && (
            <ul>
              {result.errors.map((error) => (
                <li key={error.fila}>
                  Fila {error.fila}: {error.motivo}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function ClientesVehiculosSection({
  clients,
  vehicles,
  clientForm,
  setClientForm,
  vehicleForm,
  setVehicleForm,
  importResults,
  onImport,
  onCreateClient,
  onCreateVehicle,
}) {
  return (
    <section className="taller-grid-two">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CARTERA</span>
            <h2>Nuevo cliente</h2>
          </div>
        </div>
        <form
          className="taller-import-form"
          onSubmit={(event) => onImport(event, "clientes")}
        >
          <div>
            <strong>Importar clientes</strong>
            <small>Columnas: nombre, rut, telefono y email.</small>
          </div>
          <input name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
          <button type="submit">Subir archivo</button>
        </form>
        <ImportResult result={importResults.clientes} />
        <form className="taller-form" onSubmit={onCreateClient}>
          <label>
            Nombre o razón social
            <input
              value={clientForm.name}
              onChange={(event) =>
                setClientForm({ ...clientForm, name: event.target.value })
              }
              required
            />
          </label>
          <label>
            RUT
            <input
              value={clientForm.rut}
              onChange={(event) =>
                setClientForm({ ...clientForm, rut: event.target.value })
              }
              required
            />
          </label>
          <label>
            Teléfono
            <input
              value={clientForm.phone}
              onChange={(event) =>
                setClientForm({ ...clientForm, phone: event.target.value })
              }
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={clientForm.email}
              onChange={(event) =>
                setClientForm({ ...clientForm, email: event.target.value })
              }
            />
          </label>
          <button className="primary-button wide">
            <FiPlus /> Guardar cliente
          </button>
        </form>
        <div className="records-list">
          {clients.map((client) => (
            <div className="record-row" key={client.id}>
              <span className="avatar">
                <FiUser />
              </span>
              <div>
                <b>{client.name}</b>
                <small>
                  {client.rut} · {client.phone}
                </small>
              </div>
              <strong>
                {vehicles.filter((vehicle) => vehicle.clientId === client.id).length}{" "}
                vehículo(s)
              </strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">FLOTA</span>
            <h2>Agregar vehículo</h2>
          </div>
        </div>
        <form
          className="taller-import-form"
          onSubmit={(event) => onImport(event, "vehiculos")}
        >
          <div>
            <strong>Importar vehículos</strong>
            <small>
              Columnas: patente, marca, modelo, anio, cliente_id o cliente_rut y
              kilometraje.
            </small>
          </div>
          <input name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
          <button type="submit">Subir archivo</button>
        </form>
        <ImportResult result={importResults.vehiculos} />
        <form className="taller-form" onSubmit={onCreateVehicle}>
          <label>
            Patente
            <input
              value={vehicleForm.plate}
              onChange={(event) =>
                setVehicleForm({
                  ...vehicleForm,
                  plate: event.target.value.toUpperCase(),
                })
              }
              required
            />
          </label>
          <label>
            Cliente
            <select
              value={vehicleForm.clientId}
              onChange={(event) =>
                setVehicleForm({
                  ...vehicleForm,
                  clientId: Number(event.target.value),
                })
              }
              required
            >
              <option value="">Selecciona cliente</option>
              {clients.map((client) => (
                <option value={client.id} key={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Marca
            <input
              value={vehicleForm.brand}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, brand: event.target.value })
              }
              required
            />
          </label>
          <label>
            Modelo
            <input
              value={vehicleForm.model}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, model: event.target.value })
              }
              required
            />
          </label>
          <label>
            Año
            <input
              value={vehicleForm.year}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, year: event.target.value })
              }
            />
          </label>
          <button className="primary-button wide">
            <FiPlus /> Guardar vehículo
          </button>
        </form>
        <div className="records-list">
          {vehicles.map((vehicle) => (
            <div className="record-row" key={vehicle.id}>
              <span className="avatar truck">
                <FiTruck />
              </span>
              <div>
                <b>
                  {vehicle.plate} · {vehicle.brand} {vehicle.model}
                </b>
                <small>
                  {clients.find((client) => client.id === vehicle.clientId)
                    ?.name || "Sin cliente"}{" "}
                  · {vehicle.year}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}