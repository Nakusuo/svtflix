# Contenido extraído de Canva

Todo lo que mostraba <https://svtflixesp.my.canva.site/> (2026-11-02), ya en el formato de la hoja de Google Sheets.
Cada `.csv` es **una pestaña** de la hoja. El modelo completo está en [docs/02-REQUERIMIENTOS.md §5](../docs/02-REQUERIMIENTOS.md).

| Archivo | Filas | Qué es |
|---|---|---|
| `Portada.csv` | 1 | Álbum destacado (DREAMSCAPE): logo, video de fondo, póster y botones |
| `Miembros.csv` | 13 | Top 13: foto, clip de video, biografía, datos e Instagram |
| `Musica.csv` | 15 | Música de cada integrante |
| `Programas.csv` | 403 | Programas de cada integrante |
| `Enlaces.csv` | 40 | Filas del inicio: Música, Predebut, Contenido Diverso, Going Seventeen, Proyecciones |
| `Paginas.csv` | 15 | Páginas internas (Conciertos, Premiaciones, Variety…) |
| `Contenido.csv` | 469 | Lo que hay dentro de cada página interna, con su sección (año, premiación…) |
| `Redes.csv` | 12 | CARAT (Weverse), "Sigue a SEVENTEEN" y "Escucha a SEVENTEEN" |
| `Creditos.csv` | 43 | Agradecimientos y créditos |

Imágenes y videos: **961 imágenes** en `web/img/` (WebP, 27 MB) y **14 clips** en `web/video/` (15 MB).
`imagenes.json` indica de qué imagen de Canva sale cada archivo.

---

## Cómo crear la hoja de Google Sheets (una sola vez)

1. Crea una hoja nueva en Google Sheets y llámala **SVTFLIX – Contenido**.
2. Por cada `.csv` de esta carpeta:
   **Archivo → Importar → Subir** → elige el archivo → *Ubicación de importación*: **Insertar hojas nuevas** → *Tipo de separador*: **Coma** → **Importar datos**.
   La pestaña se llama como el archivo (`Portada`, `Miembros`…). No cambies esos nombres.
3. Protege la primera fila de cada pestaña (los encabezados): selecciónala → clic derecho → **Proteger rango**.
4. Publica cada pestaña: **Archivo → Compartir → Publicar en la web** → en *Vínculo* elige la pestaña y **Valores separados por comas (.csv)** → **Publicar** → copia el enlace.
   Repite con las 9 pestañas. Cada una tiene su propio enlace.
5. Pasa los 9 enlaces al equipo de desarrollo. Van en `web/js/config.js` y es la **única vez** que hace falta tocar código.

## Cómo se actualiza la web después

```
Admin edita la hoja ──► Google publica el CSV (tarda ~5 min) ──► cada visitante que abre la web ve lo nuevo
```

- **No hay que redesplegar ni avisar a nadie.** La web lee la hoja cada vez que alguien la abre.
- Los cambios tardan **unos 5 minutos** en verse: es lo que tarda Google en refrescar el CSV publicado. Para comprobarlo, abre la web en una ventana de incógnito pasado ese tiempo.

### Recetas
| Quiero… | Qué hago en la hoja |
|---|---|
| Añadir un video o lista a una fila del inicio | Nueva fila en `Enlaces`: `Categoria` (igual que las otras de esa fila), `Titulo` y `URL_Video`. |
| Añadir algo dentro de *Conciertos*, *Variety*… | Nueva fila en `Contenido` con `Pagina` = el ID de la página (`conciertos`, `variety`…). Pon el año o la premiación en `Seccion`. |
| Crear una fila nueva en el inicio | Escribe una `Categoria` nueva en `Enlaces`. La fila aparece sola. |
| Crear una página interna nueva | Fila en `Paginas` (ID sin espacios, p. ej. `fanmeetings-kr`) + tarjeta en `Enlaces` con `Pagina` = ese ID + su contenido en `Contenido`. |
| Añadir música o programas de un integrante | Fila en `Musica` o `Programas` con `Miembro` = su ID (`hoshi`, `the8`, `s-coups`…). |
| Cambiar el álbum de la portada | Edita la fila de `Portada`. |
| Ocultar algo sin borrarlo | `Activo` = `No`. |
| Cambiar el orden | Cambia los números de `Orden` (y de `Orden_Categoria` para mover filas enteras). |

### Imágenes de contenido nuevo
- **Videos de YouTube:** deja `URL_Miniatura` vacía y la web usa la miniatura del propio video.
- **Listas de YouTube, Google Docs y otras webs:** necesitan una imagen. Pega un enlace directo a una imagen (`https://…jpg/png/webp`) que no vaya a desaparecer. Evita Pinterest e Instagram: bloquean que otras webs muestren sus imágenes. Si una imagen falla, la web pone una de reserva.
- Las imágenes que vinieron de Canva están dentro de la web (`img/…`). Para añadir ahí imágenes nuevas hay que subirlas al repositorio, y eso lo hace el equipo de desarrollo.

---

## Revisar antes de publicar

1. **Jeonghan y Joshua** no tienen bloque de datos (nombre real, fecha, estatura…) en Canva. Hay que rellenarlos a mano.
2. **12 enlaces llevan a webs de streaming no oficiales** (kissasia, kisskh, cuevana, doramasflix, myasiantvfree, kshow123): 4 en `Contenido` (conciertos, variety) y 8 en `Programas` (jun, hoshi, dk, mingyu, seungkwan). Suelen tener publicidad agresiva o malware y pueden traer problemas legales. Recomendación: cambiarlos o poner `Activo = No`.
3. **Tarjetas sin título** en Canva (hay que escribírselo):
   - `Contenido` → conciertos, enlace de Bilibili `4799036397329408`
   - `Contenido` → documentales-y-pel-culas, el Google Doc `1zns0XiP…`
4. **Correcciones automáticas:** la estatura de Woozi venía como "1.66 cm" y se dejó en "166 cm". A Seungkwan se le quitó "(26 Años)", porque la edad deja de ser correcta con el tiempo.
5. **Logo de DREAMSCAPE:** en Canva era gris sobre blanco. Se convirtió a blanco con fondo transparente para que se vea sobre el video.
6. **"Nuevo Álbum"** apuntaba a dos listas en Canva. Se usó la primera (`OLAK5uy_kfXp7…`).
7. El **orden** dentro de cada página sigue la lectura del Canva (izquierda → derecha, arriba → abajo). Revisa las páginas en cuadrícula, como Caratland.

## Volver a extraer (si el Canva cambia)

```bash
python3 tools/canva/descargar.py /tmp/canva-html     # guarda el HTML de las 29 páginas y 8 diseños
python3 tools/canva/importar.py /tmp/canva-html --imagenes
```
Las imágenes que ya existen no se vuelven a descargar.
