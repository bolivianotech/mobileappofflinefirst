# App móvil offline-first para registrar avances de obra

Aplicación móvil que permite a un técnico registrar **avances de trabajo en campo** (construcciones,
instalaciones de gas domiciliario, antenas satelitales y cualquier otro oficio) **sin necesitar internet**.
Todo se guarda primero en el celular y se sincroniza solo cuando vuelve la señal.

Este repositorio es un **proyecto de enseñanza** con tres partes:

| Carpeta | Qué contiene |
|---|---|
| [`guia/`](guia/) | 9 presentaciones `.pptx` (identidad UPDS) con el paso a paso y diapositivas **✎ MI BITÁCORA** donde cada estudiante captura su avance y arma **su propia guía personal**. |
| [`app-movil/`](app-movil/) | La app de referencia terminada: Expo (React Native) + TypeScript + SQLite. |
| [`servidor/`](servidor/) | Servidor de sincronización (Node + Express) con pruebas. |

## Cómo se usa

1. Abre `guia/Modulo0_Bienvenida.pptx` y sigue la guía en orden hasta el Módulo 8.
2. Cada estudiante construye **su propia app** desde cero en su repositorio y usa esta carpeta solo como referencia.
3. En cada diapositiva con la etiqueta **✎ MI BITÁCORA** pega capturas y escribe lo aprendido.
4. Al final reúne tus 9 archivos en una guía personal (Módulo 8).

## Ruta de módulos

| # | Archivo | Qué se construye |
|---|---|---|
| 0 | `Modulo0_Bienvenida.pptx` | Plan personal y proyecto en una frase |
| 1 | `Modulo1_Entorno.pptx` | Entorno y proyecto Expo funcionando |
| 2 | `Modulo2_ModeloDatos.pptx` | Entidades y tipos de obra propios |
| 3 | `Modulo3_BaseDatosLocal.pptx` | SQLite, migraciones y bandeja de salida |
| 4 | `Modulo4_Pantallas.pptx` | Lista, detalle y formulario dinámico |
| 5 | `Modulo5_Evidencia.pptx` | Fotos y GPS |
| 6 | `Modulo6_Sincronizacion.pptx` | Servidor, push/pull y conflictos |
| 7 | `Modulo7_PruebasCampoAPK.pptx` | Pruebas de campo y APK |
| 8 | `Modulo8_MiGuiaEntrega.pptx` | Guía personal, demo y rúbrica |

## Arranque rápido de la app de referencia

```bash
# 1) Servidor
cd servidor && npm install && npm start

# 2) App (en otra terminal)
cd app-movil && npm install && npx expo start
```

En la app: **Ajustes → URL del servidor** (`http://10.0.2.2:3000` en emulador Android, o la IP de tu PC en un celular real).

## Pruebas automáticas

```bash
cd app-movil && npm test && npm run typecheck   # motor de sincronización, conflictos, tipos de obra
cd servidor  && npm test                        # push, pull, conflictos, fotos, token
```

## Personalizar para otro oficio

Edita `app-movil/src/config/tiposObra.ts`: cada tipo de trabajo define sus **pasos** (checklist) y sus
**mediciones**. El formulario se genera solo, sin programar pantallas nuevas.

## Estado de verificación

- ✅ `servidor`: 9 pruebas automáticas pasan.
- ✅ `app-movil`: 15 pruebas automáticas pasan, `tsc --noEmit` sin errores y el bundle Android compila (`expo export`).
- ⚠️ La app **no se ha ejecutado en un dispositivo ni emulador** durante su creación (entorno sin pantalla):
  la cámara, el GPS, SQLite nativo y la subida de fotos deben validarse en un celular siguiendo los Módulos 5 a 7.
- ✅ Las 9 presentaciones pasan la validación estructural de PowerPoint y se revisaron visualmente.

## Identidad visual

Las presentaciones usan el *Manual de Identidad Corporativa UPDS 2022*: paleta oficial, Arial Black (títulos) y
Calibri (cuerpo). Datos de contacto y sedes deben confirmarse con la Dirección Nacional de Marketing antes de publicar.
