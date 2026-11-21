import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import PresupuestosSection from "./Taller/sections/PresupuestosSection.jsx";
import RepuestosSection from "./Taller/sections/RepuestosSection.jsx";
import ManoObraSection from "./Taller/sections/ManoObraSection.jsx";
import ClientesVehiculosSection from "./Taller/sections/ClientesVehiculosSection.jsx";
import OrdenItemsSection from "./Taller/sections/OrdenItemsSection.jsx";

const money = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`;
const apiOrigin = new URL(api.defaults.baseURL).origin;
const today = (() => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
})();
const errorMessage = (error) =>
  error.response?.data?.error ||
  error.response?.data?.message ||
  (typeof error.response?.data === "string" ? error.response.data : null) ||
  error.message ||
  "No se pudo completar la operación";

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
  className = "",
}) {
  const [customLabor, setCustomLabor] = useState({ name: "", code: "", price: "", quantity: "1" });
  const noLaborMatch = laborSearch && matchingLabor.length === 0;
  const noPartMatch = partSearch && matchingParts.length === 0;

  return (
    <div className={`catalog-add-panel ${className}`}>
      <div className="catalog-add-header">
        <div>
          <span className="eyebrow">DETALLE DEL SERVICIO</span>
          <h3>Agregar repuestos y mano de obra</h3>
        </div>
        <small>La mano de obra puede crearse aquí; los repuestos se administran en Inventario.</small>
      </div>
      <div className="catalog-add-section">
        <strong>Mano de obra</strong>
        <div className="catalog-search">
          <FiSearch />
          <input value={laborSearch} onChange={(event) => setLaborSearch(event.target.value)} placeholder="Código o nombre de mano de obra" />
        </div>
        {laborSearch && matchingLabor.map((item) => {
          const draft = catalogDraft(item);
          return (
            <div className="catalog-add-row" key={`labor-${item.id}`}>
              <div><b>{item.name}</b><small>{item.code || "Sin código"} · Mano de obra por hora</small></div>
              <label>Precio / h<input aria-label={`Precio por hora de ${item.name}`} type="number" min="0" value={draft.price} onChange={(event) => updateCatalogDraft(item, "price", event.target.value)} /></label>
              <label>Horas<input aria-label={`Horas de ${item.name}`} type="number" min="0.25" step="0.25" value={draft.quantity} onChange={(event) => updateCatalogDraft(item, "quantity", event.target.value)} /></label>
              <strong>{money(Number(draft.price) * Number(draft.quantity))}</strong>
              <button type="button" className="primary-button" onClick={() => addCatalogItem(item, "labor")}><FiPlus /> Agregar</button>
            </div>
          );
        })}
        {noLaborMatch && (
          <form className="custom-catalog-form" onSubmit={async (event) => {
            event.preventDefault();
            if (await createCustomLabor(customLabor)) {
              setCustomLabor({ name: "", code: "", price: "", quantity: "1" });
            }
          }}>
            <b>No existe. Agregar mano de obra nueva</b>
            <input required placeholder="Nombre de la mano de obra" value={customLabor.name} onChange={(event) => setCustomLabor({ ...customLabor, name: event.target.value })} />
            <input placeholder="Código" value={customLabor.code} onChange={(event) => setCustomLabor({ ...customLabor, code: event.target.value })} />
            <input required type="number" min="0" placeholder="Precio por hora" value={customLabor.price} onChange={(event) => setCustomLabor({ ...customLabor, price: event.target.value })} />
            <input required type="number" min="0.25" step="0.25" placeholder="Horas" value={customLabor.quantity} onChange={(event) => setCustomLabor({ ...customLabor, quantity: event.target.value })} />
            <button className="primary-button"><FiPlus /> Guardar y agregar</button>
          </form>
        )}
      </div>
      <div className="catalog-add-section">
        <strong>Repuestos</strong>
        <div className="catalog-search">
          <FiSearch />
          <input value={partSearch} onChange={(event) => setPartSearch(event.target.value)} placeholder="Código o nombre del repuesto" />
        </div>
        {partSearch && matchingParts.map((item) => {
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
          <p className="empty-inline">No se encontró el repuesto. Regístralo primero en Inventario para mantener el stock controlado.</p>
        )}
      </div>
    </div>
  );
}

function WorkOrderPrintDocument({
  selectedEntry,
  selectedClient,
  selectedVehicleData,
  selectedTotal,
  documentType = "ORDEN DE TRABAJO",
  documentNumber = selectedEntry.number,
  descriptionTitle = "Descripción del servicio",
  itemsTitle = "Costos del servicio",
}) {
  return (
    <section className="work-order-print" aria-label="Orden de trabajo imprimible">
      <div className="work-order-frame">
        <div className="work-order-title">{documentType}</div>
        <div className="work-order-grid two">
          <span>{documentType === "PRESUPUESTO" ? "Número de presupuesto" : "Número de orden"}<strong>{documentNumber}</strong></span>
          <span>Ingreso asociado<strong>{selectedEntry.number}</strong></span>
        </div>
        <div className="work-order-line">Lugar y fecha de expedición: <strong>{selectedEntry.date} · {selectedEntry.time}</strong></div>
        <div className="work-order-line">Cliente: <strong>{selectedClient?.name || "Sin cliente"}{selectedClient?.rut ? ` · ${selectedClient.rut}` : ""}</strong></div>
        <div className="work-order-grid three">
          <span>Servicio<strong>Reparación / mantenimiento</strong></span>
          <span>Vehículo<strong>{selectedVehicleData ? `${selectedVehicleData.brand} ${selectedVehicleData.model}` : "Sin vehículo"}</strong></span>
          <span>Patente<strong>{selectedVehicleData?.plate || "Sin patente"}</strong></span>
        </div>
        <div className="work-order-grid two schedule">
          <span>Recepción<strong>{selectedEntry.date}<br />{selectedEntry.time}</strong></span>
          <span>Entrega<strong>Por definir</strong></span>
        </div>
        <div className="work-order-block"><h3>{descriptionTitle}</h3><p>{selectedEntry.description || "Sin descripción"}</p></div>
        <div className="work-order-block observations"><h3>Observaciones</h3><p>{selectedEntry.observations || "Sin observaciones"}</p></div>
        <div className="work-order-grid two totals">
          <span>Total a pagar<strong>{money(selectedTotal)}</strong></span>
          <span>Cobros<strong>Se registran en Facturación</strong></span>
        </div>
        <div className="work-order-items">
          <h3>{itemsTitle}</h3>
          {selectedEntry.items.map(item => (
            <div key={item.itemId}>
              <span>{item.type === "labor" ? "MO" : "REP"} · {item.name}</span>
              <span>{item.quantity} {item.type === "labor" ? "hora(s)" : "unidad(es)"} × {money(item.price)} = <strong>{money(Number(item.quantity) * Number(item.price))}</strong></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Taller() {
  const navigate = useNavigate();
  const { ordenId } = useParams();
  const [section, setSection] = useState("ingresos");
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [labor, setLabor] = useState([]);
  const [parts, setParts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [entrySearch, setEntrySearch] = useState("");
  const [plateSearch, setPlateSearch] = useState("");
  const [laborSearch, setLaborSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [laborHours, setLaborHours] = useState("1");
  const [catalogDrafts, setCatalogDrafts] = useState({});
  const [itemDrafts, setItemDrafts] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [tallerLoaded, setTallerLoaded] = useState(false);
  const [tallerLoadError, setTallerLoadError] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);
  const [entryForm, setEntryForm] = useState({
    number: "",
    plate: "",
    description: "",
    date: today,
    time: new Date().toTimeString().slice(0, 5),
    photos: [],
  });
  const entryPhotoInput = useRef(null);
  const entryDrafts = useRef(new Map());
  const entrySaveTimers = useRef(new Map());
  const entrySaveQueues = useRef(new Map());
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
  const [importResults, setImportResults] = useState({});

  useEffect(() => {
    const pendingSaveTimers = entrySaveTimers.current;
    return () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      for (const timer of pendingSaveTimers.values()) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const loadTaller = async () => {
      try {
        const { data } = await api.get("/taller");
        setClients(data.clients);
        setVehicles(data.vehicles);
        setLabor(data.labor);
        setEntries(data.entries);
        setQuotes(data.quotes);
      } catch (error) {
        setTallerLoadError(`No se pudo cargar la información del taller: ${errorMessage(error)}`);
      } finally {
        setTallerLoaded(true);
      }
      try {
        const { data } = await api.get("/inventario");
        setParts(
          data.map((part) => ({
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
        setTallerLoadError((current) =>
          [current, `No se pudo cargar el inventario: ${errorMessage(error)}`].filter(Boolean).join(" · "),
        );
      }
    };
    loadTaller();
  }, []);

  const nextNumber = useMemo(
    () => {
      const maxNumber = entries.reduce((max, entry) => {
        const sequence = Number(String(entry.number).match(/(\d+)$/)?.[1] || 0);
        return Math.max(max, sequence);
      }, 0);
      return `ING-${String(maxNumber + 1).padStart(5, "0")}`;
    },
    [entries],
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
  const selectedEntry = entries.find((entry) =>
    ordenId ? String(entry.id) === ordenId : entry.id === selectedEntryId,
  );
  const selectedQuote = quotes.find((quote) => quote.id === selectedQuoteId);
  const quoteEntry = selectedQuote
    ? entries.find((entry) => String(entry.id) === String(selectedQuote.entryId))
    : null;
  const quoteVehicle = quoteEntry
    ? vehicles.find((vehicle) => String(vehicle.id) === String(quoteEntry.vehicleId))
    : null;
  const quoteClient = quoteVehicle
    ? clients.find((client) => String(client.id) === String(quoteVehicle.clientId))
    : null;
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
  const openEntries = entries.filter(
    (entry) => entry.status !== "Cerrado",
  ).length;

  const flash = (message, isError = false) => {
    setNotice(message);
    setNoticeError(isError);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => {
      setNotice("");
      setNoticeError(false);
    }, 4000);
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
    } catch (error) {
      flash(errorMessage(error), true);
      return;
    }
    setEntries((current) => [entry, ...current]);
    setSelectedEntryId(entry.id);
    const selectedPhotos = entryForm.photos;
    setEntryForm({
      number: "",
      plate: "",
      description: "",
      date: today,
      time: new Date().toTimeString().slice(0, 5),
      photos: [],
    });
    if (entryPhotoInput.current) entryPhotoInput.current.value = "";
    setSelectedVehicle(null);
    const { failures: uploadFailures, firstError } = await uploadPhotoFiles(entry.id, selectedPhotos);
    flash(
      uploadFailures
        ? `Ingreso creado, pero ${uploadFailures} foto(s) no se pudieron subir${firstError ? `: ${firstError}` : ""}. Adjunta las pendientes desde la orden.`
        : "Ingreso creado. Ya puedes asociar mano de obra y repuestos.",
      uploadFailures > 0,
    );
  };

  const addItem = async (item) => {
    if (!selectedEntry) {
      flash("Selecciona un ingreso antes de agregar ítems");
      return;
    }
    const itemData = {
      ...item,
      type: item.type || "labor",
      quantity: item.type === "labor"
        ? Number(item.quantity || laborHours)
        : Number(item.quantity),
    };
    try {
      const { data } = await api.post(
        `/taller/ingresos/${selectedEntry.id}/items`,
        itemData,
      );
      setEntries((current) =>
        current.map((entry) =>
          entry.id === selectedEntry.id
            ? { ...entry, items: [...entry.items, data] }
            : entry,
        ),
      );
      return data;
    } catch (error) {
      flash(errorMessage(error), true);
      return null;
    }
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
    let item;
    try {
      const { data } = await api.post("/taller/mano-obra", {
        name: form.name,
        code: form.code,
        price: Number(form.price),
        duration: "",
      });
      item = data;
    } catch (error) {
      flash(errorMessage(error), true);
      return;
    }
    setLabor((current) => [...current, item]);
    const added = await addItem({
      ...item,
      type: "labor",
      price: item.price,
      quantity: Number(form.quantity) || 1,
    });
    if (!added) return true;
    setLaborSearch("");
    flash("Mano de obra guardada y agregada a la ficha");
    return true;
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
      const { data } = await api.patch(
        `/taller/ingresos/${selectedEntry.id}/items/${itemId}`,
        updated,
      );
      setEntries((current) =>
        current.map((entry) =>
          entry.id === selectedEntry.id
            ? {
                ...entry,
                items: entry.items.map((entryItem) =>
                  entryItem.itemId === itemId ? data : entryItem,
                ),
              }
            : entry,
        ),
      );
      setItemDrafts((current) => {
        const next = { ...current };
        delete next[itemId];
        return next;
      });
    } catch (error) {
      flash(errorMessage(error), true);
    }
  };

  const itemDraft = (item) => itemDrafts[item.itemId] || {
    price: String(item.price),
    quantity: String(item.quantity),
  };

  const updateItemDraft = (item, field, value) =>
    setItemDrafts((current) => ({
      ...current,
      [item.itemId]: { ...itemDraft(item), [field]: value },
    }));

  const saveItemDraft = (item) => {
    const draft = itemDraft(item);
    const price = Number(draft.price);
    const quantity = Number(draft.quantity);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(quantity) || quantity <= 0) {
      flash("Ingresa un precio y una cantidad válidos.", true);
      return;
    }
    updateItem(item.itemId, { price, quantity });
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/taller/ingresos/${selectedEntry.id}/items/${itemId}`);
      setEntries((current) =>
        current.map((entry) =>
          entry.id === selectedEntry.id
            ? {
                ...entry,
                items: entry.items.filter((entryItem) => entryItem.itemId !== itemId),
              }
            : entry,
        ),
      );
      flash("Ítem eliminado de la orden");
    } catch (error) {
      flash(errorMessage(error), true);
    }
  };

  const createClient = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post("/taller/clientes", clientForm);
      setClients((current) => [...current, data]);
      setClientForm({ name: "", rut: "", phone: "", email: "" });
      flash("Cliente guardado");
    } catch (error) {
      flash(errorMessage(error), true);
    }
  };

  const createVehicle = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post("/taller/vehiculos", {
        ...vehicleForm,
        clientId: Number(vehicleForm.clientId),
      });
      setVehicles((current) => [...current, data]);
      setVehicleForm({ plate: "", brand: "", model: "", year: "", clientId: "" });
      flash("Vehículo guardado");
    } catch (error) {
      flash(errorMessage(error), true);
    }
  };

  const importarTallerArchivo = async (event, type) => {
    event.preventDefault();
    const form = event.currentTarget;
    const archivo = form.elements.archivo.files[0];
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
      form.reset();
      flash(`${result.imported} registro(s) importado(s); ${result.rejected} rechazado(s).`, result.rejected > 0);
    } catch (error) {
      setImportResults((current) => ({
        ...current,
        [type]: { message: error.response?.data?.message || "No se pudo importar el archivo" },
      }));
    }
  };

  const createLabor = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post("/taller/mano-obra", {
        ...laborForm,
        price: Number(laborForm.price),
      });
      setLabor((current) => [...current, data]);
      setLaborForm({ name: "", code: "", unit: "Hora", price: "", duration: "" });
      flash("Mano de obra agregada al catálogo");
    } catch (error) {
      flash(errorMessage(error), true);
    }
  };

  const createQuote = async () => {
    if (!selectedEntry) {
      flash("Selecciona un ingreso para generar su presupuesto");
      return;
    }
    try {
      const { data } = await api.post(
        `/taller/ingresos/${selectedEntry.id}/presupuesto`,
      );
      setQuotes((current) => [data, ...current]);
      setSelectedQuoteId(data.id);
      setSection("presupuestos");
      setShowServiceDetails(false);
      flash("Presupuesto generado desde el ingreso");
    } catch (error) {
      flash(errorMessage(error), true);
    }
  };

  const openBilling = () => {
    if (!selectedEntry || selectedEntry.items.length === 0) {
      flash("Agrega mano de obra o repuestos antes de facturar");
      return;
    }
    navigate(`/facturacion?orden=${encodeURIComponent(selectedEntry.id)}`);
  };

  const removeDocument = async (document, type) => {
    try {
      await api.delete(`/taller/${type}/${document.id}`);
    } catch (error) {
      flash(errorMessage(error), true);
      return;
    }
    if (type === "presupuestos")
      setQuotes((current) => current.filter((item) => item.id !== document.id));
    if (selectedQuoteId === document.id) setSelectedQuoteId(null);
    flash("Presupuesto eliminado");
  };

  const updateSelectedEntry = async (updates) => {
    if (!selectedEntry) return;
    const id = selectedEntry.id;
    const previous = entryDrafts.current.get(id) || selectedEntry;
    const optimistic = { ...previous, ...updates };
    entryDrafts.current.set(id, optimistic);
    setEntries((current) =>
      current.map((entry) => entry.id === id ? optimistic : entry),
    );
    const timer = entrySaveTimers.current.get(id);
    if (timer) window.clearTimeout(timer);
    entrySaveTimers.current.set(id, window.setTimeout(() => {
      const latest = entryDrafts.current.get(id);
      const priorSave = entrySaveQueues.current.get(id) || Promise.resolve();
      const save = priorSave.catch(() => {}).then(() =>
        api.patch(`/taller/ingresos/${id}`, {
          description: latest.description,
          status: latest.status,
        })
      );
      entrySaveQueues.current.set(id, save);
      save.then(({ data }) => {
        if (entryDrafts.current.get(id) !== latest) return;
        entryDrafts.current.delete(id);
        setEntries((current) =>
          current.map((entry) => entry.id === id ? { ...entry, ...data } : entry),
        );
      }).catch(async (error) => {
        if (entryDrafts.current.get(id) !== latest) return;
        entryDrafts.current.delete(id);
        flash(errorMessage(error), true);
        try {
          const { data } = await api.get("/taller");
          setEntries(data.entries);
        } catch (refreshError) {
          setTallerLoadError(`No se pudo actualizar la orden: ${errorMessage(refreshError)}`);
        }
      }).finally(() => {
        if (entrySaveQueues.current.get(id) === save) entrySaveQueues.current.delete(id);
      });
      entrySaveTimers.current.delete(id);
    }, 400));
  };

  const handlePhotos = (event) =>
    updateEntryForm("photos", Array.from(event.target.files || []));

  const uploadPhotoFiles = async (entryId, files) => {
    const uploaded = [];
    let failures = 0;
    let firstError = "";
    for (const file of files) {
      const formData = new FormData();
      formData.append("foto", file);
      try {
        const { data } = await api.post(
          `/taller/ingresos/${entryId}/fotos`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        uploaded.push(data);
      } catch (error) {
        failures += 1;
        if (!firstError) firstError = errorMessage(error);
      }
    }
    if (uploaded.length) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? { ...entry, photos: [...(entry.photos || []), ...uploaded] }
            : entry,
        ),
      );
    }
    return { failures, firstError };
  };

  const uploadPhotos = async (event) => {
    if (!selectedEntry) return;
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const { failures, firstError } = await uploadPhotoFiles(selectedEntry.id, files);
    flash(
      failures
        ? `${files.length - failures} foto(s) subidas; ${failures} no se pudieron guardar${firstError ? `: ${firstError}` : ""}.`
        : `${files.length} foto(s) subidas.`,
      failures > 0,
    );
  };

  if (ordenId) {
    return (
      <main className="taller-page standalone-order-page">
        {notice && <div className={`taller-toast ${noticeError ? "error" : ""}`} role={noticeError ? "alert" : "status"}>{noticeError ? <FiX /> : <FiCheck />} {notice}</div>}
        {tallerLoadError && (
          <div className="taller-load-error" role="alert">
            {tallerLoadError}
            <button className="secondary-button" onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        )}
        {!selectedEntry ? (
          <section className="standalone-order-state">
            <h1>{tallerLoaded ? "Orden no encontrada" : "Cargando orden..."}</h1>
            <button className="secondary-button" onClick={() => navigate("/taller")}>
              Volver al taller
            </button>
          </section>
        ) : (
          <>
            <header className="standalone-order-header">
              <button className="secondary-button" onClick={() => navigate("/taller")}>
                <FiChevronRight className="back-chevron" /> Volver a ingresos
              </button>
              <div>
                <span className="eyebrow">ORDEN DE TRABAJO</span>
                <h1>{selectedEntry.number}</h1>
                <p>{selectedClient?.name || "Cliente sin asignar"} · {selectedVehicleData?.plate || "Sin patente"}</p>
              </div>
              <button className="primary-button" onClick={printWorkOrder}>
                <FiPrinter /> Imprimir orden
              </button>
            </header>

            <div className="standalone-order-grid">
              <section className="panel standalone-order-editor">
                <div className="standalone-order-meta">
                  <div><small>VEHÍCULO</small><strong>{selectedVehicleData ? `${selectedVehicleData.brand} ${selectedVehicleData.model}` : "Sin vehículo"}</strong><span>{selectedVehicleData?.plate || "Sin patente"}</span></div>
                  <div><small>FECHA DE INGRESO</small><strong>{String(selectedEntry.date).slice(0, 10)}</strong><span>{selectedEntry.time}</span></div>
                  <label><small>ESTADO DE LA ORDEN</small><select value={selectedEntry.status} onChange={event => updateSelectedEntry({ status: event.target.value })}><option>Pendiente</option><option>En reparación</option><option>Esperando repuestos</option><option>Listo</option><option>Cerrado</option></select></label>
                </div>
                <label className="standalone-description">
                  Detalle del servicio
                  <textarea value={selectedEntry.description} onChange={event => updateSelectedEntry({ description: event.target.value })} placeholder="Describe el trabajo solicitado y el diagnóstico..." />
                </label>

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
                  className="standalone-catalog"
                />
              </section>

              <section className="panel standalone-costs">
                <div className="panel-heading">
                  <div><span className="eyebrow">COSTOS</span><h2>Trabajos y repuestos</h2></div>
                  <span className="count-label">{selectedEntry.items.length} conceptos</span>
                </div>
                <div className="standalone-cost-list">
                  {selectedEntry.items.map(item => (
                    <div className="standalone-cost-row" key={item.itemId}>
                      <div><strong>{item.name}</strong><small>{item.type === "labor" ? "Mano de obra" : "Repuesto"} · {item.code || "Sin código"}</small></div>
                      <label>Precio<input type="number" min="0" value={itemDraft(item).price} onChange={event => updateItemDraft(item, "price", event.target.value)} onBlur={() => saveItemDraft(item)} /></label>
                      <label>{item.type === "labor" ? "Horas" : "Cantidad"}<input type="number" min={item.type === "labor" ? "0.25" : "1"} step={item.type === "labor" ? "0.25" : "1"} value={itemDraft(item).quantity} onChange={event => updateItemDraft(item, "quantity", event.target.value)} onBlur={() => saveItemDraft(item)} /></label>
                      <strong className="standalone-cost-total">{money(Number(item.price) * Number(item.quantity))}</strong>
                      <button className="icon-button danger" title="Quitar concepto" onClick={() => removeItem(item.itemId)}><FiX /></button>
                    </div>
                  ))}
                  {!selectedEntry.items.length && <div className="empty-inline">Todavía no hay conceptos. Agrégalos desde el catálogo.</div>}
                </div>
                <div className="standalone-total-row"><span>Total de la orden</span><strong>{money(selectedTotal)}</strong></div>
              </section>
            </div>
            <WorkOrderPrintDocument selectedEntry={selectedEntry} selectedClient={selectedClient} selectedVehicleData={selectedVehicleData} selectedTotal={selectedTotal} />
          </>
        )}
      </main>
    );
  }

  return (
    <main className="taller-page">
      {notice && (
        <div className={`taller-toast ${noticeError ? "error" : ""}`} role={noticeError ? "alert" : "status"}>
          {noticeError ? <FiX /> : <FiCheck />} {notice}
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
          {selectedEntry && section !== "presupuestos" && (
            <>
              <button
                className="secondary-button"
                onClick={() => navigate(`/taller/orden/${selectedEntry.id}`)}
              >
                <FiEdit3 /> Abrir orden de trabajo
              </button>
              <button className="secondary-button" onClick={printWorkOrder}>
                <FiPrinter /> Imprimir orden
              </button>
            </>
          )}
        </div>
      </header>

      {tallerLoadError && (
        <div className="taller-load-error" role="alert">
          <span>{tallerLoadError}</span>
          <button className="secondary-button" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      )}

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
          ["facturacion", "Facturación"],
        ].map(([id, label]) => (
          <button
            className={section === id ? "active" : ""}
            key={id}
            onClick={() => {
              if (id === "facturacion") {
                navigate(
                  selectedEntry
                    ? `/facturacion?orden=${encodeURIComponent(selectedEntry.id)}`
                    : "/facturacion",
                );
                return;
              }
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
                  ref={entryPhotoInput}
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
            <div className="panel-actions">
              <button className="secondary-button" onClick={createQuote}>
                <FiEdit3 /> Crear presupuesto
              </button>
              <button className="primary-button" onClick={openBilling}>
                Ir a facturación
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
            {selectedEntry.photos?.length > 0 && (
              <div className="workshop-photo-links">
                {selectedEntry.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={`${apiOrigin}${photo.path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {photo.originalName}
                  </a>
                ))}
              </div>
            )}
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
        <ClientesVehiculosSection
          clients={clients}
          vehicles={vehicles}
          clientForm={clientForm}
          setClientForm={setClientForm}
          vehicleForm={vehicleForm}
          setVehicleForm={setVehicleForm}
          importResults={importResults}
          onImport={importarTallerArchivo}
          onCreateClient={createClient}
          onCreateVehicle={createVehicle}
        />
      )}
      {section === "labor" && (
        <ManoObraSection
          labor={labor}
          laborForm={laborForm}
          setLaborForm={setLaborForm}
          laborSearch={laborSearch}
          setLaborSearch={setLaborSearch}
          onCreate={createLabor}
          formatMoney={money}
        />
      )}
      {section === "presupuestos" && (
        <PresupuestosSection
          quotes={quotes}
          entries={entries}
          formatMoney={money}
          selectedQuoteId={selectedQuoteId}
          onViewQuote={setSelectedQuoteId}
          onRemove={removeDocument}
        />
      )}
      {section === "presupuestos" && selectedQuote && (
        <section className="panel quote-preview">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">DETALLE GUARDADO</span>
              <h2>{selectedQuote.number}</h2>
              <p className="panel-description">
                Copia del presupuesto creada el {String(selectedQuote.created).slice(0, 10)}. Los cambios posteriores a la orden no modifican este documento.
              </p>
            </div>
            <div className="panel-actions">
              <button className="secondary-button" onClick={() => setSelectedQuoteId(null)}>Cerrar</button>
              <button className="primary-button" onClick={() => window.print()} disabled={!quoteEntry}>
                <FiPrinter /> Imprimir presupuesto
              </button>
            </div>
          </div>
          {!quoteEntry ? (
            <div className="empty-inline">No se encontró la orden asociada a este presupuesto.</div>
          ) : (
            <div className="quote-preview-items">
              {selectedQuote.items?.map((item, index) => (
                <div key={`${selectedQuote.id}-${index}`}>
                  <span>{item.name} · {item.quantity} {item.type === "labor" ? "h" : "un."}</span>
                  <strong>{money(Number(item.price) * Number(item.quantity))}</strong>
                </div>
              ))}
              <div className="quote-preview-total"><span>Total guardado</span><strong>{money(selectedQuote.total)}</strong></div>
            </div>
          )}
        </section>
      )}
      {section === "presupuestos" && selectedQuote && quoteEntry && (
        <WorkOrderPrintDocument
          selectedEntry={{ ...quoteEntry, items: selectedQuote.items || [] }}
          selectedClient={quoteClient}
          selectedVehicleData={quoteVehicle}
          selectedTotal={selectedQuote.total}
          documentType="PRESUPUESTO"
          documentNumber={selectedQuote.number}
          descriptionTitle="Descripción del servicio"
          itemsTitle="Detalle presupuestado"
        />
      )}
      {section === "ingresos" && selectedEntry && (
        <OrdenItemsSection
          selectedEntry={selectedEntry}
          itemDraft={itemDraft}
          onUpdateItemDraft={updateItemDraft}
          onSaveItemDraft={saveItemDraft}
          onRemoveItem={removeItem}
          onPrint={printWorkOrder}
          formatMoney={money}
        />
      )}

      {selectedEntry && section !== "presupuestos" && (
        <WorkOrderPrintDocument
          selectedEntry={selectedEntry}
          selectedClient={selectedClient}
          selectedVehicleData={selectedVehicleData}
          selectedTotal={selectedTotal}
          descriptionTitle="Descripción"
          itemsTitle="Detalle de trabajos"
        />
      )}

      {section === "repuestos" && (
        <RepuestosSection parts={parts} formatMoney={money} />
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
              <section className="service-description-editor">
                <div>
                  <span className="eyebrow">DETALLE DEL SERVICIO</span>
                  <p>Describe el trabajo que se realizará antes de revisar sus costos.</p>
                </div>
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
                  value={selectedEntry.observations || ""}
                  onChange={(event) =>
                    updateSelectedEntry({ observations: event.target.value })
                  }
                  placeholder="Escribe observaciones del servicio"
                />
              </div>
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
            <div>
              <span>Pagos y abonos</span>
              <button className="secondary-button" onClick={openBilling}>
                Ir a Facturación
              </button>
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
          />
        )}
    </main>
  );
}

export default Taller;
