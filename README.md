# Gestor Taller

Sistema integral para la gestión de talleres automotrices y operaciones empresariales. El proyecto combina un frontend en React + Vite y un backend en Node.js + Express con PostgreSQL para administrar ingresos, clientes, vehículos, inventario, proveedores, RR.HH., facturación y presupuestos.

## Descripción general

Este software está pensado para operar como un gestor completo de taller automotriz con módulos para:

- Registro y seguimiento de ingresos de vehículos
- Gestión de clientes y vehículos
- Catálogo de mano de obra y repuestos
- Registro de trabajos, presupuestos y facturas
- Inventario de repuestos y proveedores
- Administración de recursos humanos y asistencias
- Facturación y reportes operativos

La aplicación está preparada para uso local y con conexión a PostgreSQL, con un backend REST que expone endpoints para cada módulo.

## Stack tecnológico

### Frontend
- React 19
- Vite
- React Router DOM
- React Icons
- Axios
- Chart.js y react-chartjs-2
- XLSX para importación de archivos

### Backend
- Node.js
- Express
- PostgreSQL con pg
- JWT para autenticación
- bcrypt para contraseñas
- multer para subida de archivos e imágenes
- dotenv para variables de entorno

### Base de datos
- PostgreSQL
- Esquema parcial de RR.HH., proveedores y taller en `src/Backend/schema.sql`; las tablas base de usuarios, empleados, asistencia e inventario deben provisionarse por separado.

## Estructura del proyecto

```text
gestor-taller/
├─ public/
├─ src/
│  ├─ App.jsx
│  ├─ App.css
│  ├─ index.css
│  ├─ main.jsx
│  ├─ Backend/
│  │  ├─ db.js
│  │  ├─ schema.sql
│  │  ├─ server.js
│  │  ├─ Controladores/
│  │  ├─ middlewares/
│  │  ├─ Modelos/
│  │  ├─ Rutas_Backend/
│  │  └─ utils/
│  └─ Frontend/
│     ├─ Imagenes/
│     ├─ Paginas/
│     ├─ Rutas_Frontend/
│     ├─ services/
│     └─ styles/
├─ uploads/
│  └─ ingresos/
├─ eslint.config.js
├─ index.html
├─ package.json
├─ vite.config.js
├─ README.md
└─ public/
```

## Módulos principales

### 1. Taller
Se encarga de:
- ingreso de vehículos
- clientes y vehículos asociados
- mano de obra
- repuestos
- presupuestos y facturas
- fotos de evidencia
- órdenes de trabajo

Archivos principales:
- `src/Frontend/Paginas/Taller.jsx`
- `src/Frontend/styles/Taller.css`
- `src/Backend/Rutas_Backend/tallerRoutes.js`
- `src/Backend/Controladores/tallerController.js`

### 2. Inventario
Se encarga de:
- gestión de productos y repuestos
- proveedores asociados
- búsqueda por serie o nombre
- importación masiva

Archivos principales:
- `src/Backend/Rutas_Backend/inventarioRoutes.js`
- `src/Backend/Controladores/inventarioController.js`
- `src/Frontend/Paginas/Inventario.jsx`

### 3. RR.HH.
Módulo para personal, asistencias, vacaciones, permisos, salarios y liquidaciones.

Archivos principales:
- `src/Backend/Rutas_Backend/rrhhRoutes.js`
- `src/Backend/schema.sql`
- `src/Frontend/Paginas/RRHH/RRHH.jsx`

### 4. Facturación
Módulo interno de cobros: guarda una copia de los trabajos y repuestos de cada orden, permite descuentos, IVA informativo configurable, abonos parciales e impresión. Las facturas se pueden anular conservando el historial. No genera documentos tributarios ni envía datos al SII.

La sección **Conexión con el SII** deja visible la preparación para una futura integración con LibreDTE: muestra si existen las variables `LIBREDTE_RUT` y `LIBREDTE_HASH` en el backend sin revelar sus valores, y lista los requisitos previos. No agregues credenciales durante el piloto: la emisión está forzada a desactivada, no se realizan llamadas al SII/LibreDTE ni se emiten DTE, y la presencia de credenciales no habilita emisión.

Archivos principales:
- `src/Backend/Rutas_Backend/facturacionRoutes.js`
- `src/Backend/Controladores/facturacionController.js`
- `src/Frontend/Paginas/Facturacion.jsx`

### 5. Proveedores
Control de proveedores y registro de sus facturas. Registrar una compra recibe sus repuestos en inventario dentro de la misma transacción; si el código/SKU ya existe, suma las unidades recibidas y actualiza su costo de compra, sin alterar el precio de venta.

### 6. Usuarios y autenticación
- login
- creación y gestión de usuarios
- control de sesión por token

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL 14+ o compatible
- npm
- Git

## Configuración del entorno

Crea un archivo `.env` en la raíz del proyecto con una configuración similar a esta:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/tallerdb
DATABASE_SSL=false
DATABASE_SSL_REJECT_UNAUTHORIZED=true
DB_CONNECTION_TIMEOUT_MS=10000
JWT_SECRET=tu_clave_secreta_muy_segura
```

Para PostgreSQL local, deja `DATABASE_SSL=false`. Para una base remota, configura `DATABASE_SSL=true` y conserva la validación del certificado (`DATABASE_SSL_REJECT_UNAUTHORIZED=true`); configura la CA si el proveedor lo requiere. No desactives la validación TLS en producción.

Define `JWT_SECRET` con un secreto aleatorio de al menos 32 caracteres; no uses un valor de ejemplo ni lo compartas.

`SUPABASE_URL` y las claves `SUPABASE_*` identifican la API de Supabase; no son credenciales de conexión PostgreSQL para este backend. La aplicación consulta la base usando `pg`, por lo que debes configurar `DATABASE_URL` con la URI PostgreSQL que entrega Supabase en **Connect**. No compartas esa URI, ya que contiene la contraseña de la base.

Si Node.js informa `SELF_SIGNED_CERT_IN_CHAIN` al conectarse a Supabase, descarga el certificado CA de producción desde **Supabase Dashboard → Database → Settings → SSL Configuration**. Guarda el archivo `.crt` localmente y define `PGSSLROOTCERT` con su ruta absoluta en `.env` (por ejemplo, `C:\ruta\segura\prod-ca-2021.crt`). Mantén `DATABASE_SSL=true` y `DATABASE_SSL_REJECT_UNAUTHORIZED=true`; no desactives la validación del certificado.

### Acceso a las APIs

Las rutas bajo `/api` requieren `Authorization: Bearer <token>`, excepto `POST /api/login` y `GET /api/health`. Las rutas de administración de usuarios requieren además el rol `admin`. El primer usuario administrador debe provisionarse por un procedimiento controlado directamente en la base de datos; no existe un registro público inicial.

## Instalación

1. Clona el repositorio
2. Instala dependencias:

```bash
npm install
```

3. Crea la base de datos PostgreSQL

```sql
CREATE DATABASE tallerdb;
```

4. Ajusta la conexión en `.env`
5. Provisiona las tablas base que consulta el backend (`usuarios`, `empleados`, `asistencia`, `inventario` y `salidas_inventario`) con un esquema compatible. Este repositorio no incluye actualmente un script completo para crearlas.
6. Ejecuta el esquema parcial SQL, que requiere que `empleados` ya exista

```bash
psql -U postgres -d tallerdb -f src/Backend/schema.sql
```

El servidor agrega además la columna `empleados.salario` al iniciar. El endpoint `http://localhost:3000/api/health` informa el estado de API y PostgreSQL; responde `503` si la base no está disponible.

## Ejecución

### Ejecutar frontend y backend en modo desarrollo

```bash
npm run start
```

Esto inicia:
- backend en `http://localhost:3000`
- frontend en la ruta normal de Vite, normalmente `http://localhost:5173`

### Ejecutar solo backend

```bash
npm run server
```

### Ejecutar solo frontend

```bash
npm run dev
```

### Compilar para producción

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Endpoints principales de la API

La base de la API está montada bajo `/api`.

### Autenticación y usuarios
- `POST /api/login`
- `GET /api/usuarios`
- `POST /api/usuarios`
- `GET /api/usuarios/:rut`
- `DELETE /api/usuarios/:rut`

### Inventario
- `GET /api/inventario`
- `GET /api/inventario/:numero_serie`
- `POST /api/inventario`
- `PUT /api/inventario/:numero_serie`
- `DELETE /api/inventario/:numero_serie`
- `POST /api/inventario/importar`

### Taller
- `GET /api/taller`
- `POST /api/taller/clientes`
- `POST /api/taller/vehiculos`
- `POST /api/taller/mano-obra`
- `POST /api/taller/ingresos`
- `PATCH /api/taller/ingresos/:id`
- `POST /api/taller/ingresos/:id/items`
- `PATCH /api/taller/ingresos/:id/items/:itemId`
- `DELETE /api/taller/ingresos/:id/items/:itemId`
- `POST /api/taller/ingresos/:id/presupuesto`
- `POST /api/taller/ingresos/:id/fotos`

### Proveedores
- `GET /api/proveedores`
- `POST /api/proveedores`
- `PATCH /api/proveedores/:id`
- `GET /api/proveedores/facturas`
- `POST /api/proveedores/facturas`

### Facturación interna
- `GET /api/facturacion/sii/estado` (estado seguro de preparación; nunca devuelve secretos)
- `GET /api/facturacion`
- `GET /api/facturacion/:id`
- `POST /api/facturacion/ordenes/:id/factura` (JSON opcional: `discount`, `taxRate`)
- `POST /api/facturacion/:id/pagos` (JSON: `amount`, `method`, `note`)
- `PATCH /api/facturacion/:id/anular`
- `DELETE /api/proveedores/:id`

### RR.HH.
El módulo RR.HH. expone endpoints para empleados, vacaciones, permisos, bonos, salarios y liquidaciones.

## Base de datos

El esquema base se encuentra en:
- `src/Backend/schema.sql`

Incluye tablas críticas como:
- `empleados`
- `vacaciones`
- `permisos`
- `bonos`
- `salarios`
- `liquidaciones_sueldo`
- `proveedores`
- `taller_clientes`
- `taller_vehiculos`
- `taller_mano_obra`
- `taller_ingresos`
- `taller_ingreso_items`
- `taller_facturas`
- `taller_factura_items` y `taller_factura_pagos`
- `facturas_proveedores` y `facturas_proveedores_items`
- `taller_presupuestos`
- `taller_presupuesto_items` (copia de conceptos al crear presupuesto)

## Archivos importantes

- `src/Backend/server.js` — arranque del backend y montaje de todas las rutas
- `src/Backend/db.js` — conexión a PostgreSQL con manejo de SSL
- `src/Backend/schema.sql` — modelo de datos y estructura del sistema
- `src/App.jsx` — configuración de rutas y layout general
- `src/Frontend/Paginas/Taller.jsx` — módulo principal del taller
- `src/Frontend/styles/Taller.css` — estilos del taller
- `uploads/ingresos/` — almacenamiento de fotos relevantes a órdenes

## Flujo de trabajo recomendado

1. Levantar PostgreSQL y crear la base de datos.
2. Configurar `.env` con la conexión.
3. Ejecutar `npm install`.
4. Ejecutar `npm run start` para levantar backend y frontend.
5. Ingresar a la aplicación desde el frontend.
6. Crear usuarios, clientes, vehículos y luego trabajar con ingresos del taller.

## Buenas prácticas

- Mantener `.env` fuera del control de versiones.
- No modificar el esquema SQL sin validar impacto en la app.
- Revisar logs del backend si falla la conexión a PostgreSQL.
- Usar imágenes y archivos de importación con el tamaño permitido.

## Solución de problemas comunes

### Error de conexión a PostgreSQL
- Verifica `DATABASE_URL`
- Confirma que la base existe
- Revisa `DATABASE_SSL` y `DATABASE_SSL_REJECT_UNAUTHORIZED`

### No se cargan imágenes / uploads
- Verifica que existe la carpeta `uploads/ingresos`
- Confirma el permiso de escritura del sistema

### La app no responde en frontend
- Revisa que el backend esté corriendo en el puerto configurado
- Comprueba que el navegador puede acceder a `http://localhost:3000`

## Estado del proyecto

El proyecto está estructurado como una aplicación full-stack de gestión para taller automotriz, con módulos de administración integral. Está listo para continuar ampliándose por módulos o integraciones adicionales como reportes, pagos, exportación PDF o sincronización con sistemas externos.

## Licencia

Este proyecto se entrega como aplicación de gestión interna del taller y puede adaptarse según necesidades de negocio del equipo que lo use.
