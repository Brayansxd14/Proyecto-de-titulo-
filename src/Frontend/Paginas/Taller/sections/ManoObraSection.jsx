import { FiPlus, FiSearch } from "react-icons/fi";

export default function ManoObraSection({
  labor,
  laborForm,
  setLaborForm,
  laborSearch,
  setLaborSearch,
  onCreate,
  formatMoney,
}) {
  const filteredLabor = labor.filter((item) =>
    `${item.name} ${item.code} ${item.unit} ${item.duration || ""} ${item.price}`
      .toLowerCase()
      .includes(laborSearch.toLowerCase()),
  );

  return (
    <section className="taller-grid-two">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CATÁLOGO</span>
            <h2>Agregar mano de obra</h2>
          </div>
        </div>
        <form className="taller-form" onSubmit={onCreate}>
          <label>
            Descripción del trabajo
            <input
              value={laborForm.name}
              onChange={(event) =>
                setLaborForm({ ...laborForm, name: event.target.value })
              }
              placeholder="Ej. Cambio de embrague"
              required
            />
          </label>
          <label>
            Código interno
            <input
              value={laborForm.code}
              onChange={(event) =>
                setLaborForm({ ...laborForm, code: event.target.value })
              }
              placeholder="MO-005"
            />
          </label>
          <label>
            Unidad
            <select value="Hora" disabled>
              <option>Hora</option>
            </select>
          </label>
          <label>
            Precio por hora
            <input
              type="number"
              min="0"
              value={laborForm.price}
              onChange={(event) =>
                setLaborForm({ ...laborForm, price: event.target.value })
              }
              required
            />
          </label>
          <label>
            Referencia de horas
            <input
              value={laborForm.duration}
              onChange={(event) =>
                setLaborForm({ ...laborForm, duration: event.target.value })
              }
              placeholder="Ej. 4 h"
            />
          </label>
          <button className="primary-button wide">
            <FiPlus /> Agregar al catálogo
          </button>
        </form>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">BÚSQUEDA RÁPIDA</span>
            <h2>Mano de obra disponible</h2>
          </div>
        </div>
        <div className="search-box">
          <FiSearch />
          <input
            value={laborSearch}
            onChange={(event) => setLaborSearch(event.target.value)}
            placeholder="Busca por código, nombre u horas"
          />
        </div>
        <div className="catalog-list">
          {filteredLabor.map((item) => (
            <div className="catalog-row" key={item.id}>
              <div>
                <b>{item.name}</b>
                <small>
                  {item.code || "Sin código"} · {item.unit} ·{" "}
                  {item.duration || "Sin referencia de horas"}
                </small>
              </div>
              <strong>{formatMoney(item.price)} / h</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}