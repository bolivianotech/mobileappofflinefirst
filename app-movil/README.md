# App móvil — Avance de Obra (offline-first)

Expo (React Native) + TypeScript + Expo Router + SQLite.

```bash
npm install
npx expo start      # abre con Expo Go (SDK 58) o un emulador
npm test            # pruebas del motor de sincronización y tipos de obra (requiere Node 22+)
npm run typecheck
```

## Estructura

```
app/                 pantallas (Expo Router): lista, detalle de obra, formulario de avance, ajustes
src/config/          tiposObra.ts  ← personaliza aquí tu oficio
src/db/              SQLite: migraciones, repositorios y bandeja de salida (outbox)
src/sync/            motor de sincronización (puertos y adaptadores), API HTTP y SyncProvider
src/evidencia/       fotos y GPS
tests/               pruebas automáticas (node --test)
```

## Ideas clave

- **Offline-first:** las pantallas solo hablan con SQLite; la sincronización ocurre aparte.
- **UUID** generados en el celular, **borrado lógico** y `actualizadoEn` en todo registro.
- **Bandeja de salida (outbox):** una fila por registro con cambios pendientes, escrita en la misma transacción.
- **Conflictos:** gana el último (*Last-Write-Wins*); en empate decide el id del dispositivo.
- **Fotos:** se guardan en `Paths.document`; se suben antes de enviar los datos.

## Compilar un APK

```bash
npm install -g eas-cli && eas login
eas build -p android --profile preview
```

`app.json` tiene `usesCleartextTraffic: true` solo para desarrollo con `http://`. Quítalo y usa HTTPS en producción.
