# Servidor de sincronización

Node 20+ y Express. Guarda los cambios en un archivo JSON (`datos/estado.json`) y las fotos en `datos/fotos/`.

```bash
npm install
TOKEN=mi-clave npm start     # TOKEN es opcional en desarrollo, imprescindible fuera de tu red
npm test
```

| Ruta | Función |
|---|---|
| `POST /sync/push` | Recibe cambios `{cambios:[{idCambio, entidad, id, actualizadoEn, editadoPor, datos}]}` → `{aceptados, rechazados}` |
| `GET /sync/pull?desde=N&limite=100` | Cambios con `seq > N` → `{cambios, cursor, hayMas}` |
| `PUT /fotos/:id` | Guarda el binario de la foto (idempotente) |
| `GET /salud` | Comprobación de vida |
| `GET /` | Panel HTML con las obras sincronizadas |

Es un servidor **didáctico**: para producción usa una base de datos real, HTTPS, autenticación por usuario y copias de seguridad.
