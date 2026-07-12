# Estructura de Google Sheets

El script `apps-script/Code.gs` crea estas hojas y encabezados automáticamente mediante la acción `setupSheets`.

| Hoja | Columnas, en orden |
|---|---|
| Usuarios | id, nombre, usuario, rol, estado, creadoEn |
| Inquilinos | id, nombre, documento, celular, correo, tipo, propiedadId, fechaInicio, precioMensual, diaPago, garantia, estado, observaciones, creadoEn, actualizadoEn |
| Propiedades | id, codigo, nombre, tipo, ubicacion, precioReferencial, estado, inquilinoActualId, observaciones, creadoEn, actualizadoEn |
| Movimientos | id, tipo, fechaMovimiento, monto, categoria, concepto, inquilinoId, propiedadId, metodoPago, tipoPago, periodosRelacionados, observaciones, usuarioId, creadoEn, actualizadoEn, estado |
| ObligacionesMensuales | id, inquilinoId, propiedadId, periodo, montoEsperado, montoPagado, saldoPendiente, estado, fechaVencimiento, creadoEn, actualizadoEn |
| AplicacionesPago | id, movimientoId, obligacionId, montoAplicado, creadoEn |
| Categorias | id, tipo, nombre, estado |
| Auditoria | id, entidad, entidadId, accion, datosAnteriores, datosNuevos, usuarioId, fecha |

Los IDs son UUID y nunca dependen del número de fila. Los movimientos importantes se eliminan lógicamente poniendo `estado=eliminado`.
