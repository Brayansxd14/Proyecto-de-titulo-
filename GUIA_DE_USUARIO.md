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

> El sistema valida el token con el servidor antes de abrir los módulos. Si no has iniciado sesión o el token venció, volverás a esta pantalla.

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
   - fotos como evidencia (se suben al guardar el ingreso).
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
4. El sistema guarda una copia de los conceptos y el total.
5. En la lista de presupuestos, abre el documento y pulsa **Imprimir presupuesto**. Los cambios posteriores en la orden no modifican el presupuesto guardado.

### 5.5 Facturar

Cuando el trabajo ya está definido:

1. revisa todos los conceptos,
2. confirma el total,
3. pulsa **Ir a facturación** para crear el comprobante interno,
4. registra los pagos y abonos desde el módulo **Facturación**.

### 5.6 Orden de trabajo

Desde la orden puedes:

- ver datos del vehículo y cliente,
- revisar detalle del servicio,
- agregar costos,
- guardar observaciones de la orden,
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

Permite registrar proveedores y sus facturas de compra.

Se usa para:

- almacenar información comercial,
- mantener contacto con proveedores,
- registrar el número y fecha de la factura del proveedor,
- detallar los repuestos recibidos con código, cantidad y costo,
- ingresar automáticamente los repuestos al inventario en la misma operación.

Si el código ya existe, se suma la cantidad recibida al stock y se actualiza el costo de compra sin cambiar el precio de venta. Los productos nuevos quedan con precio de venta cero; edítalos en Inventario antes de venderlos. La factura de compra y la recepción se guardan juntas: si falla una parte, no se aplica ninguna.

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

Aquí se crean y gestionan facturas internas asociadas a órdenes de trabajo. No son documentos tributarios y no se envían al SII.

Se puede:

- crear una factura desde una orden con sus trabajos y repuestos,
- configurar un descuento y un porcentaje de IVA informativo,
- abrir e imprimir el detalle de la factura,
- registrar uno o más abonos y consultar el saldo,
- anular una factura conservando la factura y los pagos en el historial.

La impresión es un comprobante interno para control del sistema; no reemplaza una factura tributaria.

Al final de esta sección aparece **Conexión con el SII**, una guía de preparación para el piloto. Indica si el backend tiene configuradas las variables del proveedor sin mostrar sus valores y enumera los pasos que faltan. La emisión está desactivada: no se generan boletas ni facturas tributarias reales desde este sistema.

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
