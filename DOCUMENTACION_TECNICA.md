# Documentación técnica del proyecto

## 1. Resumen ejecutivo

Gestor Taller es una aplicación web full-stack orientada a la gestión operativa de un taller automotriz. Integra módulos de administración de clientes, vehículos, ingresos, trabajo, inventario, proveedores, facturación y RR.HH.

La solución está compuesta por:

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: PostgreSQL
- Autenticación: JWT + almacenamiento local de token
- Carga de archivos: Multer
- Importación de datos: XLSX

## 2. Objetivo del sistema

El sistema busca centralizar la operación del taller para:

- registrar ingresos de vehículos,
- administrar clientes y vehículos,
- controlar órdenes de trabajo,
- asignar mano de obra y repuestos,
- generar presupuestos y facturas,
- revisar inventario y proveedores,
- gestionar personal y asistencia.

## 3. Arquitectura del sistema

### 3.1 Frontend

El frontend está desarrollado con React y Vite. La estructura principal se organiza por módulos y páginas.

#### Carpetas relevantes

- `src/App.jsx`: configuración general de rutas y layout
- `src/Frontend/Paginas/`: páginas principales por módulo
- `src/Frontend/styles/`: estilos por módulo
- `src/Frontend/services/api.js`: cliente HTTP hacia el backend

### 3.2 Backend

El backend está implementado con Express y monta varios routers sobre `/api`.

#### Carpetas relevantes

- `src/Backend/server.js`: arranque del servidor y montaje de rutas
- `src/Backend/db.js`: configuración de conexión a PostgreSQL
- `src/Backend/schema.sql`: esquema parcial de RR.HH., proveedores y taller; requiere tablas base existentes
- `src/Backend/Controladores/`: lógica de negocio
- `src/Backend/Rutas_Backend/`: rutas REST
- `src/Backend/middlewares/`: validaciones y middleware de autenticación
- `src/Backend/utils/`: utilidades y helpers

### 3.3 Base de datos

La base de datos usa PostgreSQL y se estructura por módulos funcionales. El archivo `schema.sql` crea tablas para:

- RR.HH. (vacaciones, permisos, bonos, salarios y liquidaciones; presupone que `empleados` ya existe)
- Proveedores y sus facturas de compra con recepción transaccional de repuestos en inventario
- Taller (clientes, vehículos, mano de obra, ingresos, items, presupuestos con detalle inmutable y facturas internas centralizadas)

El repositorio no incluye actualmente la creación inicial de `usuarios`, `empleados`, `asistencia`, `inventario` ni `salidas_inventario`. Estas tablas deben existir antes de iniciar los módulos que las consultan.

La relación entre usuario y empleado se obtiene por el RUT compartido (`usuarios.rut = empleados.rut`), sin repetir datos comunes ni añadir una columna de vínculo. Es opcional: un empleado puede existir sin una cuenta; cuando ambos registros tienen el mismo RUT, las consultas muestran en conjunto sus datos.

El módulo de empleados permite importar archivos Excel/CSV con columnas `RUT` y `Cargo` obligatorias, y `Teléfono`, `Fecha de ingreso` (AAAA-MM-DD) y `Salario` opcionales. Si un RUT ya existe, se actualizan sus datos; los campos opcionales vacíos conservan el valor actual. La exportación descarga los resultados visibles (respetando la búsqueda) como `empleados.xlsx`; también está disponible una plantilla CSV.

## 4. Flujo de ejecución

### 4.1 Inicio del proyecto

```bash
npm install
npm run start
```

Esto inicia simultáneamente backend y frontend en modo desarrollo.

### 4.2 Ejecutar por separado

```bash
npm run server
npm run dev
```

### 4.3 Generar build de producción

```bash
npm run build
```

## 5. Configuración de entorno

Se utiliza un archivo `.env` con la configuración del entorno local.

Ejemplo:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/tallerdb
DATABASE_SSL=false
DATABASE_SSL_REJECT_UNAUTHORIZED=true
DB_CONNECTION_TIMEOUT_MS=10000
JWT_SECRET=tu_clave_secreta_muy_segura
```

### Variables clave

- `PORT`: puerto del backend
- `DATABASE_URL`: conexión PostgreSQL
- `DATABASE_SSL`: habilita SSL para BD
- `DATABASE_SSL_REJECT_UNAUTHORIZED`: validación del certificado SSL
- `JWT_SECRET`: secreto aleatorio de al menos 32 caracteres para firma y validación de tokens; no existe una clave de respaldo.

Todas las rutas bajo `/api` requieren un token Bearer válido, salvo `POST /api/login` y `GET /api/health`. Las operaciones de `/api/usuarios` requieren rol `admin`. El primer administrador se debe provisionar por un procedimiento controlado en la base de datos.

`SUPABASE_URL` y las claves `SUPABASE_*` son para la API de Supabase y no reemplazan `DATABASE_URL`. El backend PostgreSQL (`pg`) necesita la URI SQL que entrega Supabase en **Connect**. No se deben intercambiar ni publicar estas credenciales.

Para validar el certificado PostgreSQL de Supabase, descarga la CA de producción desde **Database → Settings → SSL Configuration**, guarda el `.crt` localmente y configura `PGSSLROOTCERT` con su ruta absoluta. `src/Backend/db.js` carga esa CA y conserva la validación TLS; no uses `DATABASE_SSL_REJECT_UNAUTHORIZED=false` como solución.

### Facturación interna y compras

Las facturas del taller son registros internos: incluyen copia de los conceptos de la orden, descuento, una tasa de IVA informativa configurable, historial de abonos y saldo. Se pueden imprimir y anular; no son documentos tributarios, no se envían al SII y su historial no se elimina.

La pantalla de facturación incluye una preparación para integrar LibreDTE/SII. `GET /api/facturacion/sii/estado` solo informa si están definidas `LIBREDTE_RUT` y `LIBREDTE_HASH`; nunca devuelve sus valores. No agregues esas credenciales durante el piloto. La emisión permanece deshabilitada en código (`integrationImplemented: false`, `issuanceEnabled: false`): no se llama al proveedor ni al SII, aun cuando existan dichas variables. Antes de habilitar producción se debe implementar y verificar el ciclo completo de DTE, obtener autorización/certificación del emisor, configurar certificado digital y CAF por tipo de documento, proteger los secretos en el backend y validar obligaciones tributarias con asesoría contable. No se deben cargar secretos en el frontend ni tratar las facturas internas actuales como DTE.

En Proveedores se puede registrar el número y fecha de la factura de compra junto con los repuestos recibidos. El guardado de la factura, su detalle y el ingreso de stock se realizan en una única transacción. El código del repuesto se usa como SKU: si ya existe en inventario, se incrementa su cantidad y se actualiza `costo_unitario`, conservando el precio de venta; si no existe, se crea con precio de venta cero para que se defina antes de venderlo.

## 6. Módulos funcionales

### 6.1 Módulo de usuarios

Responsable de:

- login
- registro de usuarios
- consulta por RUT
- eliminación

Endpoints relevantes:

- `POST /api/login`
- `GET /api/usuarios`
- `GET /api/usuarios/exportar` (descarga Excel; no incluye contraseñas)
- `POST /api/usuarios/importar` (carga Excel/CSV solo para administradores)
- `POST /api/usuarios`
- `GET /api/usuarios/:rut`
- `DELETE /api/usuarios/:rut`

La importación requiere RUT, nombre, correo, rol y contraseña; el tipo, estado, cargo y teléfono son opcionales. Las contraseñas se cifran antes de guardarse y nunca se incluyen en la respuesta ni en la exportación. Las filas con datos inválidos o con RUT/correo ya existente se rechazan sin sobrescribir cuentas. La planilla contiene contraseñas en texto, por lo que debe manejarse de forma segura y eliminarse después de cargarla.

### 6.2 Módulo de inventario

Responsable de:

- listado de repuestos
- búsqueda por código o nombre
- creación, edición y eliminación
- importación masiva

Endpoints:

- `GET /api/inventario`
- `GET /api/inventario/buscar`
- `GET /api/inventario/:numero_serie`
- `POST /api/inventario`
- `PUT /api/inventario/:numero_serie`
- `DELETE /api/inventario/:numero_serie`
- `POST /api/inventario/importar`

### 6.3 Módulo de proveedores

- gestión de proveedores
- registro de datos comerciales
- facturas de compra con detalle de repuestos
- recepción de stock y actualización separada del costo unitario

### 6.4 Módulo de taller

Es el módulo más importante del sistema.

Incluye:

- clientes del taller
- vehículos
- mano de obra
- ingreso de vehículos
- repuestos asociados
- presupuesto y facturación
- fotos de evidencia
- detalle del servicio
- cálculo de costos

Endpoints principales:

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

Los presupuestos guardan una copia de sus líneas en `taller_presupuesto_items` dentro de la misma transacción. Se pueden consultar e imprimir desde Taller; ediciones posteriores a la orden no alteran el documento. Los cobros y abonos de facturas se realizan únicamente desde Facturación.

### 6.5 Facturación interna

- `GET /api/facturacion`
- `GET /api/facturacion/:id`
- `POST /api/facturacion/ordenes/:id/factura`
- `POST /api/facturacion/:id/pagos`
- `PATCH /api/facturacion/:id/anular`

Los comprobantes internos guardan conceptos, descuento, IVA informativo y pagos; no son DTE ni se envían al SII. La anulación conserva el historial asociado.

### 6.6 Módulo de RR.HH.

Incluye:

- empleados
- asistencia
- permisos
- vacaciones
- bonos
- liquidaciones
- salarios

## 7. Base de datos: esquema principal

El esquema se declara en `src/Backend/schema.sql` y contiene tablas como:

- `empleados`
- `vacaciones`
- `permisos`
- `bonos`
- `salarios`
- `liquidaciones_sueldo`
- `proveedores`
- `facturas_proveedores`
- `facturas_proveedores_items`
- `taller_clientes`
- `taller_vehiculos`
- `taller_mano_obra`
- `taller_ingresos`
- `taller_ingreso_items`
- `taller_fotos`
- `taller_presupuestos`
- `taller_presupuesto_items`
- `taller_facturas`
- `taller_factura_items`
- `taller_factura_pagos`

## 8. Seguridad y buenas prácticas

- Mantener `.env` fuera de control de versiones.
- Usar JWT para autenticación del backend.
- Validar entradas del usuario en el backend.
- Revisar logs de PostgreSQL y Express ante fallos.
- No realizar cambios en schemas sin validación previa.

## 9. Observaciones de desarrollo

### 9.1 Frontend

El frontend usa un layout global con sidebar y una estructura que permite navegar por módulos. El diseño puede adaptarse a nuevos módulos sin romper el patrón general.

### 9.2 Backend

El backend está modularizado por rutas y controladores, lo que facilita mantenimiento y extensión. El `server.js` es el punto de entrada y monta cada módulo funcional.

### 9.3 Base de datos

La base de datos está preparada para crecer con normativa de taller y gestión interna. La estructura soporta tanto operaciones operativas como administrativas.

## 10. Roadmap recomendado

- Mejorar validaciones y errores de API
- Añadir control de permisos por rol
- Mejorar exportación de reportes PDF/Excel
- Consolidar una capa de servicio para front y back
- Añadir pruebas automatizadas
- Habilitar despliegue con Docker o PM2

## 11. Consideraciones finales

Gestor Taller ya cuenta con una base sólida para administración del taller y procesos internos. La estructura actual permite continuar ampliando módulos sin romper la arquitectura base.

---

Documentación generada para mantenimiento, despliegue y evolución del sistema.
