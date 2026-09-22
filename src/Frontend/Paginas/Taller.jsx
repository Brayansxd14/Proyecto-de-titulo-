import { useEffect, useMemo, useState } from "react";
import {
  FiCamera,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiEdit3,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiTool,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";
import api from "../services/api";
import "../styles/Taller.css";

const initialClients = [
  {
    id: 1,
    name: "Transportes del Sur SpA",
    rut: "76.345.890-1",
    phone: "+56 9 8765 4321",
    email: "contacto@transportessur.cl",
  },
  {
    id: 2,
    name: "Logistica Andina Ltda.",
    rut: "77.120.443-8",
    phone: "+56 9 6655 1188",
    email: "flota@andina.cl",
  },
];

const initialVehicles = [
  {
    id: 1,
    plate: "ABCD12",
    brand: "Volvo",
    model: "FH 460",
    year: "2022",
    clientId: 1,
    km: "184.200",
  },
  {
    id: 2,
    plate: "KJTR45",
    brand: "Scania",
    model: "R 450",
    year: "2021",
    clientId: 2,
    km: "231.800",
  },
];

const initialLabor = [
  {
    id: 1,
    code: "MO-001",
    name: "Diagnóstico general",
    unit: "Hora",
    price: 35000,
    duration: "",
  },
  {
    id: 2,
    code: "MO-002",
    name: "Cambio de aceite y filtros",
    unit: "Hora",
    price: 48000,
    duration: "",
  },
  {
    id: 3,
    code: "MO-003",
    name: "Revisión sistema de frenos",
    unit: "Hora",
    price: 65000,
    duration: "",
  },
  {
    id: 4,
    code: "MO-004",
    name: "Reparación sistema eléctrico",
    unit: "Hora",
    price: 42000,
    duration: "1 h",
  },
];

const initialParts = [
  { id: 1, name: "Filtro de aceite Volvo", code: "FIL-V-001", price: 18900 },
  {
    id: 2,
    name: "Kit de pastillas de freno",
    code: "FRE-K-002",
    price: 125000,
  },
  { id: 3, name: "Aceite motor 15W40 (20L)", code: "ACE-15-003", price: 78000 },
];

const readStore = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const money = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`;
const today = new Date().toISOString().slice(0, 10);

function CatalogAddPanel({
  laborSearch,
  setLaborSearch,
  matchingLabor,
  partSearch,
  setPartSearch,
  matchingParts,
  catalogDraft,
  updateCatalogDraft,
  addCatalogItem,
  createCustomLabor,
  createCustomPart,
  className = "",
}) {
  const [customLabor, setCustomLabor] = useState({
    name: "",
    code: "",
    price: "",
    quantity: "1",
  });
  const [customPart, setCustomPart] = useState({
    name: "",
    code: "",
    price: "",
    quantity: "1",
  });
  const noLaborMatch = laborSearch && matchingLabor.length === 0;
  const noPartMatch = partSearch && matchingParts.length === 0;
  return (
    <div className={`catalog-add-panel ${className}`}>
      <div className="catalog-add-header">
        <div>
          <span className="eyebrow">DETALLE DEL SERVICIO</span>
          <h3>Agregar repuestos y mano de obra</h3>
        </div>
        <small>Busca primero; si no existe, créalo aquí</small>
      </div>
      <div className="catalog-add-section">
        <strong>Mano de obra</strong>
        <div className="catalog-search">
          <FiSearch />
          <input
            value={laborSearch}
            onChange={(event) => setLaborSearch(event.target.value)}
            placeholder="Código o nombre de mano de obra"
          />
        </div>
        {laborSearch &&
          matchingLabor.map((item) => {
            const draft = catalogDraft(item);
            return (
              <div className="catalog-add-row" key={`labor-${item.id}`}>
                <div>
                  <b>{item.name}</b>
                  <small>
                    {item.code || "Sin código"} · Mano de obra por hora
                  </small>
                </div>
                <label>
                  Precio / h
                  <input
                    aria-label={`Precio por hora de ${item.name}`}
                    type="number"
                    min="0"
                    value={draft.price}
                    onChange={(event) =>
                      updateCatalogDraft(item, "price", event.target.value)
                    }
                  />
                </label>
                <label>
                  Horas
                  <input
                    aria-label={`Horas de ${item.name}`}
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={draft.quantity}
                    onChange={(event) =>
                      updateCatalogDraft(item, "quantity", event.target.value)
                    }
                  />
                </label>
                <strong>
                  {money(Number(draft.price) * Number(draft.quantity))}
                </strong>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => addCatalogItem(item, "labor")}
                >
                  <FiPlus /> Agregar
                </button>
              </div>
            );
          })}
        {noLaborMatch && (
          <form
            className="custom-catalog-form"
            onSubmit={(event) => {
              event.preventDefault();
              createCustomLabor(customLabor);
              setCustomLabor({ name: "", code: "", price: "", quantity: "1" });
            }}
          >
            <b>No existe. Agregar mano de obra nueva</b>
            <input
              required
              placeholder="Nombre de la mano de obra"
              value={customLabor.name}
              onChange={(event) =>
                setCustomLabor({ ...customLabor, name: event.target.value })
              }
            />
            <input
              placeholder="Código"
              value={customLabor.code}
              onChange={(event) =>
                setCustomLabor({ ...customLabor, code: event.target.value })
              }
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Precio por hora"
              value={customLabor.price}
              onChange={(event) =>
                setCustomLabor({ ...customLabor, price: event.target.value })
              }
            />
            <input
              required
              type="number"
              min="0.25"
              step="0.25"
              placeholder="Horas"
              value={customLabor.quantity}
              onChange={(event) =>
                setCustomLabor({ ...customLabor, quantity: event.target.value })
              }
            />
            <button className="primary-button">
              <FiPlus /> Guardar y agregar
            </button>
          </form>
        )}
      </div>
      <div className="catalog-add-section">
        <strong>Repuestos</strong>
        <div className="catalog-search">
          <FiSearch />
          <input
            value={partSearch}
            onChange={(event) => setPartSearch(event.target.value)}
            placeholder="Código o nombre del repuesto"
          />
        </div>
        {partSearch &&
          matchingParts.map((item) => {
            const draft = catalogDraft(item);
            return (
              <div className="catalog-add-row" key={`part-${item.id}`}>
                <div>
                  <b>{item.name}</b>
                  <small>{item.code || "Sin código"} · Repuesto</small>
                </div>
                <label>
                  Precio
                  <input
                    aria-label={`Precio de ${item.name}`}
                    type="number"
                    min="0"
                    value={draft.price}
                    onChange={(event) =>
                      updateCatalogDraft(item, "price", event.target.value)
                    }
                  />
                </label>
                <label>
                  Cantidad
                  <input
                    aria-label={`Cantidad de ${item.name}`}
                    type="number"
                    min="1"
                    step="1"
                    value={draft.quantity}
                    onChange={(event) =>
                      updateCatalogDraft(item, "quantity", event.target.value)
                    }
                  />
                </label>
                <strong>
                  {money(Number(draft.price) * Number(draft.quantity))}
                </strong>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => addCatalogItem(item, "part")}
                >
                  <FiPlus /> Agregar
                </button>
              </div>
            );
          })}
        {noPartMatch && (
          <form
            className="custom-catalog-form"
            onSubmit={(event) => {
              event.preventDefault();
              createCustomPart(customPart);
              setCustomPart({ name: "", code: "", price: "", quantity: "1" });
            }}
          >
            <b>No existe. Agregar repuesto nuevo</b>
            <input
              required
              placeholder="Nombre del repuesto"
              value={customPart.name}
              onChange={(event) =>
                setCustomPart({ ...customPart, name: event.target.value })
              }
            />
            <input
              required
              placeholder="Código / número de serie"
              value={customPart.code}
              onChange={(event) =>
                setCustomPart({ ...customPart, code: event.target.value })
              }
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Precio unitario"
              value={customPart.price}
              onChange={(event) =>
                setCustomPart({ ...customPart, price: event.target.value })
              }
            />
            <input
              required
              type="number"
              min="1"
              placeholder="Cantidad"
              value={customPart.quantity}
              onChange={(event) =>
                setCustomPart({ ...customPart, quantity: event.target.value })
              }
            />
            <button className="primary-button">
              <FiPlus /> Guardar y agregar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function InvoiceRow({ invoice, entry, onOpen, onUpdate, onRemove }) {
  const locked = ["Pagada", "Anulada"].includes(invoice.status);
  const [total, setTotal] = useState(String(invoice.total ?? 0));
  const saveTotal = () => onUpdate(invoice, { total: Number(total) || 0 });
  return (
    <div className="quote-row invoice-row">
      <div>
        <b>{invoice.number}</b>
        <span>
          {entry?.number || "Ingreso eliminado"} ·{" "}
          {entry?.plate || "Sin patente"}
        </span>
      </div>
      <label className="invoice-field">
        Estado
        <select
          value={invoice.status}
          disabled={locked}
          onChange={(event) =>
            onUpdate(invoice, { status: event.target.value })
          }
        >
          <option>Pendiente de pago</option>
          <option>Pagada</option>
          <option>Anulada</option>
        </select>
      </label>
      <label className="invoice-field">
        Total
        <input
          type="number"
          min="0"
          value={total}
          disabled={locked}
          onChange={(event) => setTotal(event.target.value)}
          onBlur={saveTotal}
        />
      </label>
      <button className="icon-button" title="Abrir orden" onClick={onOpen}>
        <FiChevronRight />
      </button>
      {!locked && (
        <button
          className="icon-button danger"
          title="Eliminar factura"
          onClick={() => onRemove(invoice, "facturas")}
        >
          <FiX />
        </button>
      )}
    </div>
  );
}

function Taller() {
  const [section, setSection] = useState("ingresos");
  const [clients, setClients] = useState(() =>
    readStore("taller-clients", initialClients),
  );
  const [vehicles, setVehicles] = useState(() =>
    readStore("taller-vehicles", initialVehicles),
  );
  const [labor, setLabor] = useState(() =>
    readStore("taller-labor", initialLabor),
  );
  const [parts, setParts] = useState(() =>
    readStore("taller-parts", initialParts),
  );
  const [entries, setEntries] = useState(() => readStore("taller-entries", []));
  const [quotes, setQuotes] = useState(() => readStore("taller-quotes", []));
  const [invoices, setInvoices] = useState(() =>
    readStore("taller-invoices", []),
  );
  const [entrySearch, setEntrySearch] = useState("");
  const [plateSearch, setPlateSearch] = useState("");
  const [laborSearch, setLaborSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [laborHours, setLaborHours] = useState("1");
  const [catalogDrafts, setCatalogDrafts] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [notice, setNotice] = useState("");
  const [entryForm, setEntryForm] = useState({
    number: "",
    plate: "",
    description: "",
    date: today,
    time: new Date().toTimeString().slice(0, 5),
    photos: [],
  });
  const [clientForm, setClientForm] = useState({
    name: "",
    rut: "",
    phone: "",
    email: "",
  });
  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    brand: "",
    model: "",
    year: "",
    clientId: "",
  });
  const [laborForm, setLaborForm] = useState({
    name: "",
    code: "",
    unit: "Hora",
    price: "",
    duration: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    advance: 0,
    method: "Efectivo",
    observations: "",
  });
  const [importResults, setImportResults] = useState({});

  useEffect(() => {
    localStorage.setItem("taller-clients", JSON.stringify(clients));
  }, [clients]);
  useEffect(() => {
    localStorage.setItem("taller-vehicles", JSON.stringify(vehicles));
  }, [vehicles]);
  useEffect(() => {
    localStorage.setItem("taller-labor", JSON.stringify(labor));
  }, [labor]);
  useEffect(() => {
    localStorage.setItem("taller-entries", JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    localStorage.setItem("taller-quotes", JSON.stringify(quotes));
  }, [quotes]);
  useEffect(() => {
    localStorage.setItem("taller-invoices", JSON.stringify(invoices));
  }, [invoices]);
  useEffect(() => {
    localStorage.setItem("taller-parts", JSON.stringify(parts));
  }, [parts]);
  useEffect(() => {
    const loadTaller = async () => {
      try {
        const { data } = await api.get("/taller");
        setClients(data.clients);
        setVehicles(data.vehicles);
        setLabor(data.labor);
        setEntries(data.entries);
        setQuotes(data.quotes);
        setInvoices(data.invoices);
        const inventory = await api.get("/inventario");
        setParts(
          inventory.data.map((part) => ({
            id: part.numero_serie,
            code: part.numero_serie,
            name: part.nombre,
            price: Number(part.precio) || 0,
            stock: Number(part.cantidad) || 0,
            status: part.estado,
            type: part.tipo,
          })),
        );
      } catch (error) {
        console.warn(
          "Backend de taller no disponible; se mantienen los datos locales.",
          error.message,
        );
      }
    };
    loadTaller();
  }, []);

  const nextNumber = useMemo(
    () => `ING-${String(entries.length + 1).padStart(5, "0")}`,
    [entries.length],
  );
  const matchingVehicles = vehicles.filter((vehicle) =>
    vehicle.plate.toLowerCase().includes(plateSearch.toLowerCase()),
  );
  const matchingLabor = labor
    .filter((item) =>
      `${item.name} ${item.code} ${item.unit} ${item.duration || ""} ${item.price}`
        .toLowerCase()
        .includes(laborSearch.toLowerCase()),
    )
    .slice(0, 8);
  const matchingParts = parts
    .filter((item) =>
      `${item.name} ${item.code}`
        .toLowerCase()
        .includes(partSearch.toLowerCase()),
    )
    .slice(0, 5);
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId);
  const selectedVehicleData = selectedEntry
    ? vehicles.find((vehicle) => vehicle.id === selectedEntry.vehicleId)
    : null;
  const selectedClient = selectedVehicleData
    ? clients.find((client) => client.id === selectedVehicleData.clientId)
    : null;
  const selectedTotal =
    selectedEntry?.items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    ) || 0;
  const selectedBalance = Math.max(
    0,
    selectedTotal - Number(paymentForm.advance || 0),
  );
  const openEntries = entries.filter(
    (entry) => entry.status !== "Cerrado",
  ).length;

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const printWorkOrder = () => {
    if (!selectedEntry) {
      flash("Selecciona un ingreso para imprimir su orden");
      return;
    }
    window.print();
  };
  const updateEntryForm = (name, value) =>
    setEntryForm((form) => ({ ...form, [name]: value }));

  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    updateEntryForm("plate", vehicle.plate);
    setPlateSearch(vehicle.plate);
  };

  const createEntry = async (event) => {
    event.preventDefault();
    const vehicle = vehicles.find(
      (item) => item.plate.toLowerCase() === entryForm.plate.toLowerCase(),
    );
    if (!vehicle) {
      flash("Selecciona un vehículo registrado o agrega uno en Clientes");
      return;
    }
    const entryNumber = entryForm.number || nextNumber;
    let entry;
    try {
      const { data } = await api.post("/taller/ingresos", {
        number: entryNumber,
        plate: vehicle.plate,
        date: entryForm.date,
        time: entryForm.time,
        description: entryForm.description,
      });
      entry = data;
    } catch {
      entry = {
        ...entryForm,
        id: Date.now(),
        number: entryNumber,
        vehicleId: vehicle.id,
        clientId: vehicle.clientId,
        status: "Pendiente",
        items: [],
        photos: [],
      };
    }
    setEntries((current) => [entry, ...current]);
    setSelectedEntryId(entry.id);
    setEntryForm({
      number: nextNumber,
      plate: "",
      description: "",
      date: today,
      time: new Date().toTimeString().slice(0, 5),
      photos: [],
    });
    setSelectedVehicle(null);
    flash("Ingreso creado. Ya puedes asociar mano de obra y repuestos.");
  };

  const addItem = async (item) => {
    if (!selectedEntry) {
      flash("Selecciona un ingreso antes de agregar ítems");
      return;
    }
    const itemData = { ...item };
    const newItem = {
      ...itemData,
      type: item.type || "labor",
      quantity:
        item.type === "labor"
          ? Number(item.quantity || laborHours) || 1
          : Number(item.quantity) || 1,
    };
    try {
      const { data } = await api.post(
        `/taller/ingresos/${selectedEntry.id}/items`,
        newItem,
      );
      newItem.itemId = data.itemId;
    } catch {
      newItem.itemId = `${selectedEntry.id}-${selectedEntry.items.length + 1}`;
    }
    setEntries((current) =>
      current.map((entry) =>
        entry.id === selectedEntry.id
          ? { ...entry, items: [...entry.items, newItem] }
          : entry,
      ),
    );
    flash(
      `${item.type === "part" ? "Repuesto" : "Mano de obra"} agregado al ingreso`,
    );
  };

  const catalogDraft = (item) =>
    catalogDrafts[item.id] || { price: String(item.price || 0), quantity: "1" };
  const updateCatalogDraft = (item, field, value) =>
    setCatalogDrafts((current) => ({
      ...current,
      [item.id]: { ...catalogDraft(item), [field]: value },
    }));
  const addCatalogItem = async (item, type) => {
    const draft = catalogDraft(item);
    await addItem({
      ...item,
      type,
      price: Number(draft.price) || 0,
      quantity: Number(draft.quantity) || 1,
    });
    setCatalogDrafts((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
  };

  const createCustomLabor = async (form) => {
    let item = {
      id: `local-labor-${labor.length + 1}`,
      name: form.name,
      code: form.code,
      unit: "Hora",
      price: Number(form.price) || 0,
      duration: "",
    };
    try {
      const { data } = await api.post("/taller/mano-obra", item);
      item = data;
    } catch {
      /* respaldo local */
    }
    setLabor((current) => [...current, item]);
    await addItem({
      ...item,
      type: "labor",
      price: item.price,
      quantity: Number(form.quantity) || 1,
    });
    setLaborSearch("");
    flash("Mano de obra guardada y agregada a la ficha");
  };

  const createCustomPart = async (form) => {
    let item = {
      id: form.code || `local-part-${parts.length + 1}`,
      code: form.code,
      name: form.name,
      price: Number(form.price) || 0,
      stock: Number(form.quantity) || 1,
      type: "Otro",
    };
    try {
      const { data } = await api.post("/inventario", {
        numero_serie: form.code,
        nombre: form.name,
        cantidad: Number(form.quantity) || 1,
        precio: Number(form.price) || 0,
        tipo: "Otro",
        proveedor: "",
      });
      item = {
        id: data.numero_serie,
        code: data.numero_serie,
        name: data.nombre,
        price: Number(data.precio) || 0,
        stock: Number(data.cantidad) || 0,
        status: data.estado,
        type: data.tipo,
      };
    } catch {
      /* respaldo local */
    }
    setParts((current) => [...current, item]);
    await addItem({
      ...item,
      type: "part",
      price: item.price,
      quantity: Number(form.quantity) || 1,
    });
    setPartSearch("");
    flash("Repuesto guardado y agregado a la ficha");
  };

  const updateItem = async (itemId, changes) => {
    const item = selectedEntry?.items.find(
      (entryItem) => entryItem.itemId === itemId,
    );
    if (!item) return;
    const updated = {
      ...item,
      ...changes,
      price: Number(changes.price ?? item.price),
      quantity: Number(changes.quantity ?? item.quantity),
    };
    try {
      await api.patch(
        `/taller/ingresos/${selectedEntry.id}/items/${itemId}`,
        updated,
      );
    } catch {
      /* respaldo local */
    }
    setEntries((current) =>
      current.map((entry) =>
        entry.id === selectedEntry.id
          ? {
              ...entry,
              items: entry.items.map((entryItem) =>
                entryItem.itemId === itemId ? updated : entryItem,
              ),
            }
          : entry,
      ),
    );
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/taller/ingresos/${selectedEntry.id}/items/${itemId}`);
    } catch {
      /* respaldo local */
    }
    setEntries((current) =>
      current.map((entry) =>
        entry.id === selectedEntry.id
          ? {
              ...entry,
              items: entry.items.filter(
                (entryItem) => entryItem.itemId !== itemId,
              ),
            }
          : entry,
      ),
    );
    flash("Ítem eliminado de la orden");
  };

  const createClient = async (event) => {
    event.preventDefault();
    let client = { ...clientForm, id: Date.now() };
    try {
      const { data } = await api.post("/taller/clientes", client);
      client = data;
    } catch {
      /* respaldo local */
    }
    setClients((current) => [...current, client]);
    setClientForm({ name: "", rut: "", phone: "", email: "" });
    flash("Cliente guardado");
  };

  const createVehicle = async (event) => {
    event.preventDefault();
    let vehicle = {
      ...vehicleForm,
      id: Date.now(),
      plate: vehicleForm.plate.toUpperCase(),
    };
    try {
      const { data } = await api.post("/taller/vehiculos", vehicle);
      vehicle = data;
    } catch {
      /* respaldo local */
    }
    setVehicles((current) => [...current, vehicle]);
    setVehicleForm({ plate: "", brand: "", model: "", year: "", clientId: "" });
    flash("Vehículo guardado");
  };

  const importarTallerArchivo = async (event, type) => {
    event.preventDefault();
    const archivo = event.currentTarget.elements.archivo.files[0];
    if (!archivo) return;
    const data = new FormData();
    data.append("archivo", archivo);
    try {
      const { data: result } = await api.post(`/taller/${type}/importar`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResults((current) => ({ ...current, [type]: result }));
      const { data: taller } = await api.get("/taller");
      setClients(taller.clients);
      setVehicles(taller.vehicles);
      event.currentTarget.reset();
    } catch (error) {
      setImportResults((current) => ({
        ...current,
        [type]: { message: error.response?.data?.message || "No se pudo importar el archivo" },
      }));
    }
  };

  const createLabor = async (event) => {
    event.preventDefault();
    let item = { ...laborForm, id: Date.now(), price: Number(laborForm.price) };
    try {
      const { data } = await api.post("/taller/mano-obra", item);
      item = data;
    } catch {
      /* respaldo local */
    }
    setLabor((current) => [...current, item]);
    setLaborForm({ name: "", code: "", unit: "Hora", price: "", duration: "" });
    flash("Mano de obra agregada al catálogo");
  };

  const createQuote = async () => {
    if (!selectedEntry) {
      flash("Selecciona un ingreso para generar su presupuesto");
      return;
    }
    let quote = {
      id: `local-quote-${quotes.length + 1}`,
      number: `PRES-${String(quotes.length + 1).padStart(4, "0")}`,
      entryId: selectedEntry.id,
      status: "Borrador",
      total: selectedEntry.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      ),
      created: today,
    };
    try {
      const { data } = await api.post(
        `/taller/ingresos/${selectedEntry.id}/presupuesto`,
      );
      quote = data;
    } catch {
      /* respaldo local */
    }
    setQuotes((current) => [quote, ...current]);
    flash("Presupuesto generado desde el ingreso");
  };

  const createInvoice = async () => {
    if (!selectedEntry || selectedEntry.items.length === 0) {
      flash("Agrega mano de obra o repuestos antes de facturar");
      return;
    }
    const total = selectedEntry.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );
    let invoice = {
      id: `local-invoice-${invoices.length + 1}`,
      number: `FAC-${String(invoices.length + 1).padStart(5, "0")}`,
      entryId: selectedEntry.id,
      status: "Pendiente de pago",
      total,
      created: today,
    };
    try {
      const { data } = await api.post(
        `/taller/ingresos/${selectedEntry.id}/factura`,
      );
      invoice = data;
    } catch {
      /* respaldo local */
    }
    setInvoices((current) => [invoice, ...current]);
    flash("Factura creada desde la orden de trabajo");
  };

  const updateInvoice = async (invoice, changes) => {
    if (["Pagada", "Anulada"].includes(invoice.status)) {
      flash("Esta factura está cerrada y no se puede modificar");
      return;
    }
    const updated = {
      ...invoice,
      ...changes,
      total: Number(changes.total ?? invoice.total) || 0,
    };
    try {
      const { data } = await api.patch(
        `/taller/facturas/${invoice.id}`,
        changes,
      );
      setInvoices((current) =>
        current.map((item) => (item.id === invoice.id ? data : item)),
      );
      flash("Factura actualizada");
    } catch (error) {
      if (error.response?.status === 409) {
        flash(error.response.data);
        return;
      }
      setInvoices((current) =>
        current.map((item) => (item.id === invoice.id ? updated : item)),
      );
      flash("Factura actualizada localmente");
    }
  };

  const removeDocument = async (document, type) => {
    try {
      await api.delete(`/taller/${type}/${document.id}`);
    } catch (error) {
      if (error.response?.status === 409) {
        flash(error.response.data);
        return;
      }
    }
    if (type === "presupuestos")
      setQuotes((current) => current.filter((item) => item.id !== document.id));
    if (type === "facturas")
      setInvoices((current) =>
        current.filter((item) => item.id !== document.id),
      );
    flash(`${type === "presupuestos" ? "Presupuesto" : "Factura"} eliminado`);
  };

  const updateSelectedEntry = (updates) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === selectedEntry?.id ? { ...entry, ...updates } : entry,
      ),
    );
    api.patch(`/taller/ingresos/${selectedEntry?.id}`, updates).catch(() => {});
  };

  const handlePhotos = (event) =>
    updateEntryForm(
      "photos",
      Array.from(event.target.files || []).map((file) => file.name),
    );

  const uploadPhotos = async (event) => {
    if (!selectedEntry) return;
    for (const file of Array.from(event.target.files || [])) {
      const formData = new FormData();
      formData.append("foto", file);
      try {
        const { data } = await api.post(
          `/taller/ingresos/${selectedEntry.id}/fotos`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        updateSelectedEntry({
          photos: [...(selectedEntry.photos || []), data],
        });
      } catch {
        flash("No se pudo subir una de las fotos");
      }
    }
  };

  return (
    <main className="taller-page">
      {notice && (
        <div className="taller-toast">
          <FiCheck /> {notice}
        </div>
      )}
      <header className="taller-header">
        <div>
          <span className="eyebrow">OPERACIÓN DEL TALLER</span>
          <h1>Centro de servicio</h1>
          <p>
            Controla ingresos, clientes, vehículos y presupuestos desde un solo
            lugar.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="primary-button"
            onClick={() => {
              setSection("ingresos");
              setSelectedEntryId(null);
              setShowServiceDetails(false);
              updateEntryForm("number", nextNumber);
            }}
          >
            <FiPlus /> Nuevo ingreso
          </button>
          {selectedEntry && (
            <>
              <button
                className="secondary-button"
                onClick={() => setShowServiceDetails(true)}
              >
                <FiEdit3 /> Modificar orden
              </button>
              <button className="secondary-button" onClick={printWorkOrder}>
                <FiPrinter /> Imprimir orden
              </button>
            </>
          )}
        </div>
      </header>

      <section className="taller-stats">
        <div>
          <span className="stat-icon blue">
            <FiTruck />
          </span>
          <div>
            <strong>{openEntries}</strong>
            <small>Ingresos abiertos</small>
          </div>
        </div>
        <div>
          <span className="stat-icon orange">
            <FiUser />
          </span>
          <div>
            <strong>{clients.length}</strong>
            <small>Clientes registrados</small>
          </div>
        </div>
        <div>
          <span className="stat-icon green">
            <FiTool />
          </span>
          <div>
            <strong>{vehicles.length}</strong>
            <small>Vehículos en cartera</small>
          </div>
        </div>
        <div>
          <span className="stat-icon violet">
            <FiEdit3 />
          </span>
          <div>
            <strong>{quotes.length}</strong>
            <small>Presupuestos creados</small>
          </div>
        </div>
      </section>

      <nav className="taller-tabs" aria-label="Secciones de taller">
        {[
          ["ingresos", "Ingresos"],
          ["clientes", "Clientes y vehículos"],
          ["labor", "Mano de obra"],
          ["repuestos", "Repuestos"],
          ["presupuestos", "Presupuestos"],
          ["facturas", "Facturas"],
        ].map(([id, label]) => (
          <button
            className={section === id ? "active" : ""}
            key={id}
            onClick={() => {
              setSection(id);
              setShowServiceDetails(false);
            }}
          >
            {label}
            <FiChevronRight />
          </button>
        ))}
      </nav>

      {section === "ingresos" && (
        <section className="taller-workspace">
          <div className="panel entry-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PASO 01</span>
                <h2>Registrar ingreso</h2>
              </div>
              <span className="status-chip">Nuevo</span>
            </div>
            <form className="taller-form" onSubmit={createEntry}>
              <label>
                Número de ingreso
                <input
                  value={entryForm.number}
                  onChange={(event) =>
                    updateEntryForm("number", event.target.value)
                  }
                  placeholder={nextNumber}
                />
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  value={entryForm.date}
                  onChange={(event) =>
                    updateEntryForm("date", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                Hora de ingreso
                <input
                  type="time"
                  value={entryForm.time}
                  onChange={(event) =>
                    updateEntryForm("time", event.target.value)
                  }
                  required
                />
              </label>
              <label className="wide">
                Patente del vehículo
                <div className="autocomplete">
                  <FiSearch />
                  <input
                    value={plateSearch}
                    onChange={(event) => {
                      setPlateSearch(event.target.value);
                      updateEntryForm("plate", event.target.value);
                      setSelectedVehicle(null);
                    }}
                    placeholder="Escribe la patente..."
                    required
                  />
                  {plateSearch &&
                    matchingVehicles.length > 0 &&
                    !selectedVehicle && (
                      <div className="suggestions">
                        {matchingVehicles.map((vehicle) => (
                          <button
                            type="button"
                            key={vehicle.id}
                            onClick={() => selectVehicle(vehicle)}
                          >
                            <strong>{vehicle.plate}</strong>
                            <span>
                              {vehicle.brand} {vehicle.model}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </label>
              {selectedVehicle ? (
                <div className="vehicle-preview wide">
                  <FiTruck />
                  <div>
                    <strong>
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </strong>
                    <span>
                      {
                        clients.find(
                          (client) => client.id === selectedVehicle.clientId,
                        )?.name
                      }{" "}
                      · Año {selectedVehicle.year} ·{" "}
                      {selectedVehicle.km || "Sin km"} km
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVehicle(null);
                      setPlateSearch("");
                      updateEntryForm("plate", "");
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="empty-inline wide">
                  Busca una patente para completar automáticamente el cliente y
                  los datos del vehículo.
                </div>
              )}
              <label className="wide">
                Motivo del ingreso
                <textarea
                  value={entryForm.description}
                  onChange={(event) =>
                    updateEntryForm("description", event.target.value)
                  }
                  placeholder="Describe la falla o el trabajo solicitado..."
                  required
                />
              </label>
              <label className="wide upload-label">
                <FiCamera /> Evidencia fotográfica
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotos}
                />
                <small>
                  {entryForm.photos.length
                    ? `${entryForm.photos.length} archivo(s) seleccionados`
                    : "Puedes adjuntar fotos después de crear el ingreso."}
                </small>
              </label>
              <button className="primary-button wide" type="submit">
                <FiPlus /> Crear ingreso y orden de trabajo
              </button>
            </form>
          </div>

          <div className="panel orders-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SEGUIMIENTO</span>
                <h2>Ingresos recientes</h2>
              </div>
              <span className="count-label">{entries.length} registros</span>
            </div>
            <div className="search-box">
              <FiSearch />
              <input
                value={entrySearch}
                onChange={(event) => setEntrySearch(event.target.value)}
                placeholder="Buscar por ingreso, patente o cliente"
              />
            </div>
            <div className="entry-list">
              {entries
                .filter((entry) =>
                  `${entry.number} ${entry.plate} ${entry.description}`
                    .toLowerCase()
                    .includes(entrySearch.toLowerCase()),
                )
                .map((entry) => {
                  const vehicle = vehicles.find(
                    (item) => item.id === entry.vehicleId,
                  );
                  return (
                    <button
                      className={`entry-card ${selectedEntryId === entry.id ? "selected" : ""}`}
                      key={entry.id}
                      onClick={() => {
                        setSelectedEntryId(entry.id);
                        setShowServiceDetails(false);
                      }}
                    >
                      <div className="entry-card-top">
                        <strong>{entry.number}</strong>
                        <span>{entry.status}</span>
                      </div>
                      <div>
                        <b>{entry.plate}</b> · {vehicle?.brand} {vehicle?.model}
                      </div>
                      <p>{entry.description}</p>
                      <small>
                        <FiClock /> {entry.date} · {entry.time} ·{" "}
                        {entry.items.length} ítem(s)
                      </small>
                    </button>
                  );
                })}
              {entries.length === 0 && (
                <div className="empty-state">
                  <FiTruck />
                  <strong>Aún no hay ingresos</strong>
                  <span>El primer ingreso aparecerá aquí.</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {section === "ingresos" && selectedEntry && (
        <section className="panel items-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PASO 02 · {selectedEntry.number}</span>
              <h2>Trabajos asociados</h2>
            </div>
            <button className="secondary-button" onClick={createQuote}>
              <FiEdit3 /> Crear presupuesto
            </button>
          </div>
          <div className="item-columns">
            <div>
              <h3>Mano de obra</h3>
              <div className="search-box">
                <FiSearch />
                <input
                  value={laborSearch}
                  onChange={(event) => setLaborSearch(event.target.value)}
                  placeholder="Escribe para buscar mano de obra..."
                />
              </div>
              {laborSearch &&
                matchingLabor.map((item) => (
                  <button
                    className="result-row"
                    key={item.id}
                    onClick={() => addItem({ ...item, type: "labor" })}
                  >
                    <span>
                      <b>{item.name}</b>
                      <small>
                        {item.code} · {item.duration}
                      </small>
                    </span>
                    <strong>{money(item.price)}</strong>
                    <FiPlus />
                  </button>
                ))}
              <div className="custom-item">
                <span>¿No está en el catálogo?</span>
                <button onClick={() => setSection("labor")}>
                  Agregar mano de obra <FiChevronRight />
                </button>
              </div>
            </div>
            <div>
              <h3>Repuestos</h3>
              <div className="search-box">
                <FiSearch />
                <input
                  value={partSearch}
                  onChange={(event) => setPartSearch(event.target.value)}
                  placeholder="Buscar repuesto..."
                />
              </div>
              {partSearch &&
                matchingParts.map((item) => (
                  <button
                    className="result-row"
                    key={item.id}
                    onClick={() => addItem({ ...item, type: "part" })}
                  >
                    <span>
                      <b>{item.name}</b>
                      <small>{item.code}</small>
                    </span>
                    <strong>{money(item.price)}</strong>
                    <FiPlus />
                  </button>
                ))}
            </div>
            <div className="attached-items">
              <h3>Agregados a la orden</h3>
              {selectedEntry.items.map((item) => (
                <div className="attached-row" key={item.itemId}>
                  <span>
                    <i>{item.type === "part" ? "REP" : "MO"}</i>
                    {item.name}
                  </span>
                  <strong>{money(item.price)}</strong>
                </div>
              ))}
              <div className="total-row">
                <span>Total estimado</span>
                <strong>
                  {money(
                    selectedEntry.items.reduce(
                      (sum, item) => sum + Number(item.price) * item.quantity,
                      0,
                    ),
                  )}
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}
      {section === "ingresos" && selectedEntry && (
        <section className="panel items-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PASO 02 · {selectedEntry.number}</span>
              <h2>Trabajos asociados</h2>
            </div>
            <div className="panel-actions">
              <button className="secondary-button" onClick={createQuote}>
                <FiEdit3 /> Crear presupuesto
              </button>
              <button className="primary-button" onClick={createInvoice}>
                Facturar
              </button>
            </div>
          </div>
          <div className="edit-entry-bar">
            <label>
              Descripción
              <input
                value={selectedEntry.description}
                onChange={(event) =>
                  updateSelectedEntry({ description: event.target.value })
                }
              />
            </label>
            <label>
              Estado
              <select
                value={selectedEntry.status}
                onChange={(event) =>
                  updateSelectedEntry({ status: event.target.value })
                }
              >
                <option>Pendiente</option>
                <option>En reparación</option>
                <option>Esperando repuestos</option>
                <option>Listo</option>
                <option>Cerrado</option>
              </select>
            </label>
            <label className="photo-edit">
              <FiCamera /> Subir evidencia
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={uploadPhotos}
              />
              <small>{selectedEntry.photos?.length || 0} foto(s)</small>
            </label>
          </div>
          <div className="item-columns">
            <div>
              <h3>Mano de obra</h3>
              <div className="search-box">
                <FiSearch />
                <input
                  value={laborSearch}
                  onChange={(event) => setLaborSearch(event.target.value)}
                  placeholder="Escribe para buscar mano de obra..."
                />
              </div>
              {laborSearch &&
                matchingLabor.map((item) => (
                  <button
                    className="result-row"
                    key={item.id}
                    onClick={() => addItem({ ...item, type: "labor" })}
                  >
                    <span>
                      <b>{item.name}</b>
                      <small>
                        {item.code} · {item.duration}
                      </small>
                    </span>
                    <strong>{money(item.price)}</strong>
                    <FiPlus />
                  </button>
                ))}
              <div className="custom-item">
                <span>¿No está en el catálogo?</span>
                <button onClick={() => setSection("labor")}>
                  Agregar mano de obra <FiChevronRight />
                </button>
              </div>
            </div>
            <div>
              <h3>Repuestos</h3>
              <div className="search-box">
                <FiSearch />
                <input
                  value={partSearch}
                  onChange={(event) => setPartSearch(event.target.value)}
                  placeholder="Buscar repuesto..."
                />
              </div>
              {partSearch &&
                matchingParts.map((item) => (
                  <button
                    className="result-row"
                    key={item.id}
                    onClick={() => addItem({ ...item, type: "part" })}
                  >
                    <span>
                      <b>{item.name}</b>
                      <small>{item.code}</small>
                    </span>
                    <strong>{money(item.price)}</strong>
                    <FiPlus />
                  </button>
                ))}
            </div>
            <div className="attached-items">
              <h3>Agregados a la orden</h3>
              {selectedEntry.items.map((item) => (
                <div className="attached-row" key={item.itemId}>
                  <span>
                    <i>{item.type === "part" ? "REP" : "MO"}</i>
                    {item.name}
                  </span>
                  <strong>{money(item.price)}</strong>
                </div>
              ))}
              <div className="total-row">
                <span>Total estimado</span>
                <strong>
                  {money(
                    selectedEntry.items.reduce(
                      (sum, item) => sum + Number(item.price) * item.quantity,
                      0,
                    ),
                  )}
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}

      {section === "clientes" && (
        <section className="taller-grid-two">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">CARTERA</span>
                <h2>Nuevo cliente</h2>
              </div>
            </div>
            <form className="taller-import-form" onSubmit={(event) => importarTallerArchivo(event, "clientes")}>
              <div><strong>Importar clientes</strong><small>Columnas: nombre, rut, telefono y email.</small></div>
              <input name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
              <button type="submit">Subir archivo</button>
            </form>
            {importResults.clientes && <div className="taller-import-result">{importResults.clientes.message ? <strong>{importResults.clientes.message}</strong> : <><strong>{importResults.clientes.imported} importado(s)</strong><span>{importResults.clientes.rejected} rechazado(s)</span>{importResults.clientes.errors?.length > 0 && <ul>{importResults.clientes.errors.map(error => <li key={error.fila}>Fila {error.fila}: {error.motivo}</li>)}</ul>}</>}</div>}
            <form className="taller-form" onSubmit={createClient}>
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
                    {
                      vehicles.filter(
                        (vehicle) => vehicle.clientId === client.id,
                      ).length
                    }{" "}
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
            <form className="taller-import-form" onSubmit={(event) => importarTallerArchivo(event, "vehiculos")}>
              <div><strong>Importar vehículos</strong><small>Columnas: patente, marca, modelo, anio, cliente_id o cliente_rut y kilometraje.</small></div>
              <input name="archivo" type="file" accept=".csv,.xlsx,.xls" required />
              <button type="submit">Subir archivo</button>
            </form>
            {importResults.vehiculos && <div className="taller-import-result">{importResults.vehiculos.message ? <strong>{importResults.vehiculos.message}</strong> : <><strong>{importResults.vehiculos.imported} importado(s)</strong><span>{importResults.vehiculos.rejected} rechazado(s)</span>{importResults.vehiculos.errors?.length > 0 && <ul>{importResults.vehiculos.errors.map(error => <li key={error.fila}>Fila {error.fila}: {error.motivo}</li>)}</ul>}</>}</div>}
            <form className="taller-form" onSubmit={createVehicle}>
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
                    setVehicleForm({
                      ...vehicleForm,
                      brand: event.target.value,
                    })
                  }
                  required
                />
              </label>
              <label>
                Modelo
                <input
                  value={vehicleForm.model}
                  onChange={(event) =>
                    setVehicleForm({
                      ...vehicleForm,
                      model: event.target.value,
                    })
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
      )}

      {section === "labor" && (
        <section className="taller-grid-two">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">CATÁLOGO</span>
                <h2>Agregar mano de obra</h2>
              </div>
            </div>
            <form className="taller-form" onSubmit={createLabor}>
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
              {labor
                .filter((item) =>
                  `${item.name} ${item.code} ${item.unit} ${item.duration || ""} ${item.price}`
                    .toLowerCase()
                    .includes(laborSearch.toLowerCase()),
                )
                .map((item) => (
                  <div className="catalog-row" key={item.id}>
                    <div>
                      <b>{item.name}</b>
                      <small>
                        {item.code || "Sin código"} · {item.unit} ·{" "}
                        {item.duration || "Sin referencia de horas"}
                      </small>
                    </div>
                    <strong>{money(item.price)} / h</strong>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {section === "presupuestos" && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PROPUESTAS COMERCIALES</span>
              <h2>Presupuestos</h2>
            </div>
            <span className="count-label">{quotes.length} creados</span>
          </div>
          <div className="quote-list">
            {quotes.map((quote) => {
              const entry = entries.find((item) => item.id === quote.entryId);
              return (
                <div className="quote-row" key={quote.id}>
                  <div>
                    <b>{quote.number}</b>
                    <span>
                      {entry?.number || "Ingreso eliminado"} ·{" "}
                      {entry?.plate || "Sin patente"}
                    </span>
                  </div>
                  <span className="status-chip">{quote.status}</span>
                  <strong>{money(quote.total)}</strong>
                  <button
                    className="icon-button"
                    title="Modificar presupuesto"
                    onClick={() => {
                      setSection("ingresos");
                      setSelectedEntryId(quote.entryId);
                      setShowServiceDetails(true);
                    }}
                  >
                    <FiEdit3 />
                  </button>
                  <button
                    className="icon-button danger"
                    title="Eliminar presupuesto"
                    onClick={() => removeDocument(quote, "presupuestos")}
                  >
                    <FiX />
                  </button>
                </div>
              );
            })}
            {quotes.length === 0 && (
              <div className="empty-state">
                <FiEdit3 />
                <strong>No hay presupuestos</strong>
                <span>Selecciona un ingreso y crea su primer presupuesto.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {section === "facturas" && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">COBRANZAS</span>
              <h2>Facturas</h2>
            </div>
            <span className="count-label">{invoices.length} emitidas</span>
          </div>
          <div className="quote-list">
            {invoices.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                entry={entries.find((item) => item.id === invoice.entryId)}
                onUpdate={updateInvoice}
                onOpen={() => {
                  setSection("ingresos");
                  setSelectedEntryId(invoice.entryId);
                  setShowServiceDetails(false);
                }}
                onRemove={removeDocument}
              />
            ))}
            {invoices.length === 0 && (
              <div className="empty-state">
                <FiEdit3 />
                <strong>No hay facturas</strong>
                <span>Agrega trabajos a una orden y pulsa Facturar.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {section === "ingresos" && selectedEntry && (
        <section className="panel item-management-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">EDICIÓN DE ÍTEMS</span>
              <h2>Modificar o eliminar trabajos</h2>
              <p className="panel-description">
                Puedes cambiar el precio, las horas o la cantidad de cada
                elemento.
              </p>
            </div>
            <button className="primary-button" onClick={printWorkOrder}>
              <FiPrinter /> Imprimir orden
            </button>
          </div>
          <div className="managed-items">
            {selectedEntry.items.map((item) => (
              <div className="managed-item" key={item.itemId}>
                <div className="managed-item-name">
                  <strong>{item.name}</strong>
                  <small>
                    {item.code || "Sin código"} ·{" "}
                    {item.type === "labor" ? "Mano de obra" : "Repuesto"}
                  </small>
                </div>
                <label>
                  Precio
                  <input
                    type="number"
                    min="0"
                    value={item.price}
                    onChange={(event) =>
                      updateItem(item.itemId, { price: event.target.value })
                    }
                  />
                </label>
                <label>
                  {item.type === "labor" ? "Horas" : "Cantidad"}
                  <input
                    type="number"
                    min={item.type === "labor" ? "0.25" : "1"}
                    step={item.type === "labor" ? "0.25" : "1"}
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.itemId, { quantity: event.target.value })
                    }
                  />
                </label>
                <strong className="managed-total">
                  {money(Number(item.price) * Number(item.quantity))}
                </strong>
                <button
                  type="button"
                  className="icon-button danger"
                  title="Eliminar ítem"
                  onClick={() => removeItem(item.itemId)}
                >
                  <FiX />
                </button>
              </div>
            ))}
            {selectedEntry.items.length === 0 && (
              <div className="empty-inline">
                No hay ítems agregados a esta orden.
              </div>
            )}
          </div>
          <div className="payment-editor">
            <label>
              Adelanto
              <input
                type="number"
                min="0"
                value={paymentForm.advance}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    advance: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Forma de pago
              <select
                value={paymentForm.method}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, method: event.target.value })
                }
              >
                <option>Efectivo</option>
                <option>Cheque</option>
                <option>Transferencia</option>
                <option>Depósito</option>
              </select>
            </label>
            <label className="wide">
              Observaciones
              <textarea
                value={paymentForm.observations}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    observations: event.target.value,
                  })
                }
                placeholder="Notas para la orden impresa"
              />
            </label>
          </div>
        </section>
      )}

      {selectedEntry && (
        <section
          className="work-order-print"
          aria-label="Orden de trabajo imprimible"
        >
          <div className="work-order-frame">
            <div className="work-order-title">ORDEN DE TRABAJO</div>
            <div className="work-order-grid two">
              <span>
                Número de orden<strong>{selectedEntry.number}</strong>
              </span>
              <span>
                Folio<strong>{selectedEntry.id}</strong>
              </span>
            </div>
            <div className="work-order-line">
              Lugar y fecha de expedición:{" "}
              <strong>
                {selectedEntry.date} · {selectedEntry.time}
              </strong>
            </div>
            <div className="work-order-line">
              Cliente:{" "}
              <strong>
                {selectedClient?.name || "Sin cliente"}
                {selectedClient?.rut ? ` · ${selectedClient.rut}` : ""}
              </strong>
            </div>
            <div className="work-order-grid three">
              <span>
                Servicio<strong>Reparación / mantenimiento</strong>
              </span>
              <span>
                Vehículo
                <strong>
                  {selectedVehicleData
                    ? `${selectedVehicleData.brand} ${selectedVehicleData.model}`
                    : "Sin vehículo"}
                </strong>
              </span>
              <span>
                Patente
                <strong>{selectedVehicleData?.plate || "Sin patente"}</strong>
              </span>
            </div>
            <div className="work-order-grid two schedule">
              <span>
                Recepción
                <strong>
                  {selectedEntry.date}
                  <br />
                  {selectedEntry.time}
                </strong>
              </span>
              <span>
                Entrega<strong>Por definir</strong>
              </span>
            </div>
            <div className="work-order-block">
              <h3>Descripción</h3>
              <p>{selectedEntry.description || "Sin descripción"}</p>
            </div>
            <div className="work-order-block observations">
              <h3>Observaciones</h3>
              <p>{paymentForm.observations || " "}</p>
            </div>
            <div className="work-order-grid three totals">
              <span>
                Total a pagar<strong>{money(selectedTotal)}</strong>
              </span>
              <span>
                Adelanto<strong>{money(paymentForm.advance)}</strong>
              </span>
              <span>
                Restante<strong>{money(selectedBalance)}</strong>
              </span>
            </div>
            <div className="payment-heading">
              Forma de pago: <strong>{paymentForm.method}</strong>
            </div>
            <div className="work-order-grid four payment-options">
              <span>Cheque</span>
              <span>Transferencia</span>
              <span>Depósito</span>
              <span>Efectivo</span>
            </div>
            <div className="work-order-items">
              <h3>Detalle de trabajos</h3>
              {selectedEntry.items.map((item) => (
                <div key={item.itemId}>
                  <span>
                    {item.type === "labor" ? "MO" : "REP"} · {item.name}
                  </span>
                  <span>
                    {item.quantity}{" "}
                    {item.type === "labor" ? "hora(s)" : "unidad(es)"} ×{" "}
                    {money(item.price)} ={" "}
                    <strong>
                      {money(Number(item.quantity) * Number(item.price))}
                    </strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {section === "repuestos" && (
        <section className="panel parts-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">INVENTARIO DEL TALLER</span>
              <h2>Registro de repuestos</h2>
              <p className="panel-description">
                Consulta todos los repuestos registrados, tanto los nuevos como
                los que ya no tienen stock.
              </p>
            </div>
            <span className="count-label">{parts.length} registrados</span>
          </div>
          <div className="parts-summary">
            <div>
              <strong>
                {parts.filter((part) => Number(part.stock) > 0).length}
              </strong>
              <span>Con stock</span>
            </div>
            <div>
              <strong>
                {parts.filter((part) => Number(part.stock) <= 0).length}
              </strong>
              <span>Sin stock / cerrados</span>
            </div>
          </div>
          <div className="parts-table-wrap">
            <table className="parts-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Repuesto</th>
                  <th>Tipo</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.id}>
                    <td>{part.code}</td>
                    <td>
                      <strong>{part.name}</strong>
                    </td>
                    <td>{part.type || "Sin tipo"}</td>
                    <td>{money(part.price)}</td>
                    <td>{part.stock}</td>
                    <td>
                      <span
                        className={`inventory-status ${Number(part.stock) > 0 ? "available" : "closed"}`}
                      >
                        {Number(part.stock) > 0 ? "Disponible" : "Sin stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parts.length === 0 && (
              <div className="empty-state">
                <FiTool />
                <strong>No hay repuestos registrados</strong>
                <span>Agrega repuestos desde el módulo Inventario.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {selectedEntry &&
        showServiceDetails &&
        (section === "ingresos" || section === "presupuestos") && (
          <section className="service-document-editor">
            <div className="service-document-head">
              <div>
                <span className="eyebrow">
                  {section === "presupuestos"
                    ? "PRESUPUESTO"
                    : "ORDEN DE TRABAJO"}
                </span>
                <h2>
                  {section === "presupuestos"
                    ? "Presupuesto de servicio"
                    : "Orden de servicio"}
                </h2>
              </div>
              <div className="panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => setShowServiceDetails(false)}
                >
                  Cerrar
                </button>
                <button className="primary-button" onClick={printWorkOrder}>
                  <FiPrinter /> Vista de impresión
                </button>
              </div>
            </div>
            <div className="service-document-sheet">
              <div className="service-brand">
                <div className="service-logo">GT</div>
                <div>
                  <strong>GESTOR TALLER</strong>
                  <small>Mecánica y servicio automotriz</small>
                </div>
                <b>
                  {section === "presupuestos"
                    ? "PRESUPUESTO"
                    : "ORDEN DE SERVICIO"}
                </b>
                <span>Folio: {selectedEntry.number}</span>
              </div>
              <div className="service-customer-grid">
                <div>
                  <small>DATOS DEL VEHÍCULO</small>
                  <p>
                    Marca: <strong>{selectedVehicleData?.brand || "-"}</strong>
                  </p>
                  <p>
                    Modelo: <strong>{selectedVehicleData?.model || "-"}</strong>
                  </p>
                  <p>
                    Patente:{" "}
                    <strong>{selectedVehicleData?.plate || "-"}</strong>
                  </p>
                  <p>
                    Ingreso:{" "}
                    <strong>
                      {selectedEntry.date} {selectedEntry.time}
                    </strong>
                  </p>
                </div>
                <div>
                  <small>DATOS DEL CLIENTE</small>
                  <p>
                    Nombre: <strong>{selectedClient?.name || "-"}</strong>
                  </p>
                  <p>
                    RUT: <strong>{selectedClient?.rut || "-"}</strong>
                  </p>
                  <p>
                    Teléfono: <strong>{selectedClient?.phone || "-"}</strong>
                  </p>
                  <p>
                    Email: <strong>{selectedClient?.email || "-"}</strong>
                  </p>
                </div>
              </div>
              <div className="service-edit-fields">
                <label>
                  Estado
                  <select
                    value={selectedEntry.status}
                    onChange={(event) =>
                      updateSelectedEntry({ status: event.target.value })
                    }
                  >
                    <option>Pendiente</option>
                    <option>En reparación</option>
                    <option>Esperando repuestos</option>
                    <option>Listo</option>
                    <option>Cerrado</option>
                  </select>
                </label>
                <label>
                  Descripción del trabajo
                  <textarea
                    value={selectedEntry.description}
                    onChange={(event) =>
                      updateSelectedEntry({ description: event.target.value })
                    }
                    required
                  />
                </label>
              </div>
              <div className="service-add-bar">
                <div className="service-search">
                  <FiSearch />
                  <input
                    value={laborSearch}
                    onChange={(event) => setLaborSearch(event.target.value)}
                    placeholder="Buscar mano de obra por código, nombre u horas"
                  />
                  {laborSearch &&
                    matchingLabor.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => addItem({ ...item, type: "labor" })}
                      >
                        <span>
                          {item.code} · {item.name}
                        </span>
                        <strong>{money(item.price)} / h</strong>
                      </button>
                    ))}
                </div>
                <label>
                  Horas
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={laborHours}
                    onChange={(event) => setLaborHours(event.target.value)}
                  />
                </label>
                <div className="service-search">
                  <FiSearch />
                  <input
                    value={partSearch}
                    onChange={(event) => setPartSearch(event.target.value)}
                    placeholder="Buscar repuesto por código o nombre"
                  />
                  {partSearch &&
                    matchingParts.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => addItem({ ...item, type: "part" })}
                      >
                        <span>
                          {item.code} · {item.name}
                        </span>
                        <strong>{money(item.price)}</strong>
                      </button>
                    ))}
                </div>
              </div>
              <table className="service-items-table">
                <thead>
                  <tr>
                    <th>CANT.</th>
                    <th>DESCRIPCIÓN DEL TRABAJO / REPUESTO</th>
                    <th>COSTO UNITARIO</th>
                    <th>IMPORTE</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntry.items.map((item) => (
                    <tr key={item.itemId}>
                      <td>
                        {item.quantity} {item.type === "labor" ? "h" : ""}
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                        <small>
                          {item.type === "labor" ? "Mano de obra" : "Repuesto"}{" "}
                          · {item.code || "Sin código"}
                        </small>
                      </td>
                      <td>{money(item.price)}</td>
                      <td>
                        <strong>
                          {money(Number(item.price) * Number(item.quantity))}
                        </strong>
                      </td>
                      <td>
                        <button
                          className="icon-button danger"
                          title="Eliminar"
                          onClick={() => removeItem(item.itemId)}
                        >
                          <FiX />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="service-observations">
                <strong>OBSERVACIONES</strong>
                <textarea
                  value={paymentForm.observations}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      observations: event.target.value,
                    })
                  }
                  placeholder="Escribe observaciones del servicio"
                />
              </div>
              <section className="service-description-editor">
                <label>
                  Descripción del trabajo
                  <textarea
                    value={selectedEntry.description}
                    onChange={(event) =>
                      updateSelectedEntry({ description: event.target.value })
                    }
                    required
                  />
                </label>
              </section>
            </div>
          </section>
        )}
      {selectedEntry &&
        showServiceDetails &&
        (section === "ingresos" || section === "presupuestos") && (
          <section className="service-total-editor">
            <div>
              <span>Total del servicio</span>
              <strong>{money(selectedTotal)}</strong>
            </div>
            <label>
              <span>Adelanto</span>
              <input
                type="number"
                min="0"
                value={paymentForm.advance}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    advance: event.target.value,
                  })
                }
              />
            </label>
            <div>
              <span>Saldo restante</span>
              <strong>{money(selectedBalance)}</strong>
            </div>
          </section>
        )}
      {selectedEntry &&
        showServiceDetails &&
        (section === "ingresos" || section === "presupuestos") && (
          <CatalogAddPanel
            laborSearch={laborSearch}
            setLaborSearch={setLaborSearch}
            matchingLabor={matchingLabor}
            partSearch={partSearch}
            setPartSearch={setPartSearch}
            matchingParts={matchingParts}
            catalogDraft={catalogDraft}
            updateCatalogDraft={updateCatalogDraft}
            addCatalogItem={addCatalogItem}
            createCustomLabor={createCustomLabor}
            createCustomPart={createCustomPart}
          />
        )}
    </main>
  );
}

export default Taller;
