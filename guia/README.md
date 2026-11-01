# Guía paso a paso (presentaciones)

Nueve presentaciones `.pptx` con la identidad visual de la UPDS. Son **plantillas de trabajo**: cada estudiante
las completa y conserva, hasta formar su propia guía personal.

## Tipos de diapositiva

| Aspecto | Significado |
|---|---|
| Fondo blanco | Contenido de la guía: leer y ejecutar |
| Fondo celeste + etiqueta **✎ MI BITÁCORA** | El estudiante **completa**: pega capturas y escribe con sus palabras |
| Diapositiva **★ Tu reto de personalización** | Cambio propio que hace la app única |
| **Autoevaluación** | Preguntas; las respuestas están en las *notas del orador* para el docente |

## Para el docente

- Duración total sugerida: unas 15 horas (ver cada portada).
- Las **notas del orador** de cada diapositiva traen consejos de clase y soluciones.
- Evalúe con la rúbrica del Módulo 8 (editable).
- Pida entregar los 9 archivos individuales y la guía unida (`Guia_Nombre.pptx` y `.pdf`).

## Regenerar o modificar las presentaciones

El contenido está en `generador/contenido/moduloN.js` y el diseño en `generador/lib.js`.

```bash
cd guia/generador
npm install
node build.js        # genera los 9 archivos en guia/
node build.js 3      # solo el módulo 3
```

Tipos de diapositiva disponibles: `portada`, `objetivos`, `concepto`, `comparar`, `pasos`, `codigo`,
`diagrama`, `tabla`, `captura`, `campos`, `reto`, `autoevaluacion`, `cierre`.

> Arial Black y Calibri vienen con Microsoft Office. En LibreOffice/Google Slides se sustituyen por fuentes similares.
