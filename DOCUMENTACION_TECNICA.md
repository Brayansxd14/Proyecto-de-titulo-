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
- `src/Backend/schema.sql`: esquema inicial de la base de datos
- `src/Backend/Controladores/`: lógica de negocio
- `src/Backend/Rutas_Backend/`: rutas REST
- `src/Backend/middlewares/`: validaciones y middleware de autenticación
- `src/Backend/utils/`: utilidades y helpers

### 3.3 Base de datos

La base de datos usa PostgreSQL y se estructura por módulos funcionales. El esquema incluye tablas para:

- RR.HH. (empleados, vacaciones, permisos, bonos, sueldos, liquidaciones)
- Proveedores
- Taller (clientes, vehículos, mano de obra, ingresos, items, facturas, presupuestos)
- Inventario

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
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DB_CONNECTION_TIMEOUT_MS=10000
JWT_SECRET=tu_clave_secreta_muy_segura
```

### Variables clave

- `PORT`: puerto del backend
- `DATABASE_URL`: conexión PostgreSQL
- `DATABASE_SSL`: habilita SSL para BD
- `DATABASE_SSL_REJECT_UNAUTHORIZED`: validación del certificado SSL
- `JWT_SECRET`: clave para firma de tokens

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
- `POST /api/usuarios`
- `GET /api/usuarios/:rut`
- `DELETE /api/usuarios/:rut`

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
- relación con inventario y compras

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
- `POST /api/taller/ingresos/:id/factura`
- `POST /api/taller/ingresos/:id/fotos`

### 6.5 Módulo de RR.HH.

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
- `taller_clientes`
- `taller_vehiculos`
- `taller_mano_obra`
- `taller_ingresos`
- `taller_ingreso_items`
- `taller_fotos`
- `taller_presupuestos`
- `taller_facturas`

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
