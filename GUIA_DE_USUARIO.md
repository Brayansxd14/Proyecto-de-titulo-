# Guía de usuario del sistema Gestor Taller

## 1. Introducción

Gestor Taller es una aplicación para administrar operaciones de un taller automotriz, desde la recepción del vehículo hasta la generación de presupuestos y facturas.

La plataforma está pensada para que todo el flujo se soporte en una sola solución:

- recepción de vehículos,
- gestión de clientes,
- gestión de inventario,
- trabajo y costos,
- facturación,
- recursos humanos.

## 2. Acceso al sistema

1. Abre la aplicación en el navegador.
2. Ingresa con tu usuario y contraseña.
3. Si la sesión es válida, el sistema te llevará al dashboard principal.

> La sesión se valida por token local, por lo que debes mantener la autenticación activa durante la sesión del navegador.

## 3. Vista general del sistema

La interfaz principal tiene una barra lateral izquierda con los módulos disponibles:

- Inicio
- Recursos Humanos
- Inventario
- Taller
- Facturación
- Proveedores
- Cerrar sesión

## 4. Módulo Inicio

Desde la pantalla de inicio puedes ver un resumen general del estado del negocio.

Generalmente incluye:

- ingresos recientes,
- resumen de clientes,
- estado del taller,
- indicadores de operación,
- acceso rápido a módulos importantes.

## 5. Módulo Taller

Es el módulo principal del sistema.

### 5.1 Registrar ingreso

1. Ingresa a Taller.
2. Selecciona la opción de crear ingreso.
3. Completa:
   - número de ingreso,
   - fecha,
   - hora,
   - patente,
   - descripción del problema,
   - fotos como evidencia.
4. Guarda el ingreso.

### 5.2 Asociar vehículo y cliente

Cuando escribes la patente, el sistema puede buscar vehículos registrados para completar información del cliente y el modelo del auto.

### 5.3 Agregar mano de obra y repuestos

En la orden de trabajo puedes:

- buscar mano de obra existente,
- agregar repuestos,
- ajustar cantidades,
- editar precios,
- calcular el subtotal automáticamente.

### 5.4 Crear presupuesto

1. Selecciona el ingreso.
2. Agrega trabajos y repuestos.
3. Haz clic en la opción de crear presupuesto.
4. El sistema genera un documento con el total estimado.

### 5.5 Facturar

Cuando el trabajo ya está definido:

1. revisa todos los conceptos,
2. confirma el total,
3. genera la factura,
4. deja registrado el estado de cobro.

### 5.6 Orden de trabajo

Desde la orden puedes:

- ver datos del vehículo y cliente,
- revisar detalle del servicio,
- agregar costos,
- editar adelanto y forma de pago,
- imprimir la orden final.

## 6. Módulo Inventario

Aquí puedes gestionar el stock de repuestos y materiales.

### Funciones principales

- registrar repuestos,
- buscar por código o nombre,
- modificar precios y cantidades,
- eliminar productos si corresponde,
- importar archivos CSV/XLS/XLSX si la funcionalidad está habilitada.

## 7. Módulo Proveedores

Permite registrar a los proveedores del taller.

Se usa para:

- almacenar información comercial,
- mantener contacto con proveedores,
- relacionar productos y compras.

## 8. Módulo RR.HH.

Este módulo está orientado a la administración del personal.

Incluye:

- empleados,
- asistencia,
- permisos,
- vacaciones,
- bonos,
- liquidaciones,
- salarios.

## 9. Módulo Facturación

Aquí se revisan y gestionan las facturas emitidas, su estado y el seguimiento de pagos.

Se puede:

- ver facturas emitidas,
- abrir la orden asociada,
- actualizar estado de pago,
- revisar totales.

## 10. Recomendaciones de uso

- Actualiza siempre el ingreso antes de generar presupuesto o factura.
- Verifica precios y cantidades de repuestos antes de cerrar una orden.
- Usa la descripción del servicio con información clara para el cliente.
- Mantén la patente, cliente y vehículo asociados para mejor trazabilidad.
- Guarda fotografías relevantes para cada ingreso.

## 11. Flujo recomendado de operación

### Caso típico

1. Registrar ingreso del vehículo.
2. Completar información del cliente y la patente.
3. Describir el problema o trabajo a realizar.
4. Agregar mano de obra y repuestos.
5. Revisar costos y total estimado.
6. Generar presupuesto.
7. Confirmar y facturar si corresponde.
8. Cerrar la orden con la información final.

## 12. Problemas frecuentes

### No puedo iniciar sesión

- valida que el usuario exista,
- revisa que las credenciales sean correctas,
- revisa que el token de sesión no haya caducado.

### No aparece un vehículo o cliente

- asegúrate de haberlo registrado previamente,
- verifica que la patente esté escrita correctamente.

### No se puede imprimir la orden

- revisa que la orden exista,
- verifica que la página cargó correctamente,
- prueba desde el botón de imprimir de la vista de orden.

## 13. Mejores prácticas

- Guarda siempre los datos del cliente antes de cerrar el ingreso.
- Mantén un catálogo limpio con descripciones claras.
- Revisa pendientes de pago y presupuestos cada día.
- Usa la evidencia visual para documentar el trabajo realizado.

## 14. Soporte y mantenimiento

Para cualquier falla técnica o solicitud de mejora, se recomienda:

- revisar logs del backend,
- verificar la conexión a PostgreSQL,
- validar que los archivos de entorno estén bien configurados,
- mantener actualizado el código y la base de datos.

---

Guía orientada a uso real del sistema por parte del personal del taller y administración.
