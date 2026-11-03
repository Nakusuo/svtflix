# SVTFLIX en Español — Requerimientos

> Versión 0.1 · 2026-11-02 · Ver también [01-PLAN](01-PLAN.md)
>
> Prioridad **MoSCoW**: **M** = imprescindible · **S** = debería · **C** = podría · **W** = no en esta versión

---

## 1. Actores

| Actor | Descripción |
|---|---|
| **Visitante (CARAT)** | Cualquier persona que entra a la web. No se registra ni inicia sesión. |
| **Admin de contenido** | Personas de @SVTFLIX_ESP con permiso de edición en la hoja de Google Sheets. No necesita saber programar. |
| **Desarrollador** | Mantiene el código en GitHub y el despliegue en Vercel. |
| *Google Sheets* (sistema) | Fuente de contenido: publica cada pestaña como CSV. |
| *YouTube* (sistema) | Aloja todos los videos y listas, y sirve las miniaturas. |
| *Google Forms* (sistema) | Recibe las sugerencias y las guarda en una hoja privada. |
| *Vercel* (sistema) | Compila y sirve la web. |

## 2. Requerimientos funcionales (RF)

### Datos
| ID | Requerimiento | Prio. |
|---|---|---|
| RF-01 | Al cargar la página (`DOMContentLoaded`), pedir **en paralelo** las 7 pestañas CSV definidas en `config.js`. | M |
| RF-02 | Normalizar los encabezados: sin tildes, sin mayúsculas, sin espacios extra y con espacios o guiones unificados en `_`. Así `"Título Álbum "`, `titulo_album` y `TITULO-ALBUM` son la misma columna. | M |
| RF-03 | Descartar filas vacías y filas con `Activo = No`, y ordenar por la columna `Orden` cuando exista. | M |
| RF-04 | Si una pestaña falla o llega vacía, mostrar el resto de secciones con normalidad y un mensaje amable solo en la sección afectada. | M |
| RF-05 | Guardar en el navegador (`localStorage`) la última copia válida de cada pestaña y usarla si la red o Google fallan. | S |
| RF-06 | Mostrar esqueletos (*skeletons*) mientras llegan los datos. | S |

### Cabecera y portada
| ID | Requerimiento | Prio. |
|---|---|---|
| RF-07 | Cabecera fija con el logo SVTFLIX en Español y el enlace **CARAT**, con URL tomada de `Redes`. La cabecera se oscurece al hacer scroll. | M |
| RF-08 | El hero reproduce el teaser de `Portada` **silenciado, en bucle y sin controles**, a pantalla ancha. | M |
| RF-09 | El hero muestra una imagen póster mientras carga, si el autoplay falla o si el usuario tiene activado *reducir movimiento*. | M |
| RF-10 | El hero muestra el logo o título del álbum, el botón **Reproducir** (abre el reproductor con `URL_Boton_Principal`) y el botón secundario (texto y URL de la hoja). | M |
| RF-11 | Botón para activar y desactivar el sonido del teaser. | C |

### Top 13 e integrantes
| ID | Requerimiento | Prio. |
|---|---|---|
| RF-12 | Carrusel horizontal "Conoce a los 13 miembros" ordenado por `Numero`, con botones laterales, desplazamiento táctil, rueda y teclado (flechas). | M |
| RF-13 | **Números gigantes en capas:** el número va en la capa inferior (`z-index: 1`) a la izquierda y la tarjeta (`z-index: 2`) tapa exactamente su lado derecho, sin desalinearse en ningún ancho. Se hace con CSS Grid y celdas superpuestas, sin posiciones absolutas "a ojo". | M |
| RF-14 | Cada tarjeta muestra la foto vertical 2:3, la etiqueta de subunidad (*Líder · Hip-Hop*, *Vocal*, *Performance*) y el nombre artístico. | M |
| RF-15 | Al pulsar una tarjeta se abre la **ficha (modal)** con foto de fondo horizontal, nombre artístico, emoji, nombre real, fecha y lugar de nacimiento, estatura, signo, biografía y botón a Instagram. | M |
| RF-16 | La ficha muestra las filas **Música** y **Programas** filtradas por integrante. Si no hay nada, aparece "Aún no hay contenido". | M |
| RF-17 | Cada elemento de Música y Programas abre el reproductor (RF-22). | M |
| RF-18 | El modal se cierra con la X, la tecla `Esc` o un clic fuera. Mientras está abierto, el foco no sale de él, y al cerrarlo vuelve a la tarjeta de origen. | M |
| RF-19 | La URL cambia a `#miembro/<id>` al abrir una ficha, y al entrar con ese enlace la ficha se abre sola. | C |

### Redes y plataformas
| ID | Requerimiento | Prio. |
|---|---|---|
| RF-20 | Secciones **Sigue a SEVENTEEN** y **Escucha a SEVENTEEN** con icono, nombre y enlace, tomadas de `Redes` y agrupadas por `Seccion`. Se abren en pestaña nueva. | M |

### Catálogo y reproductor
| ID | Requerimiento | Prio. |
|---|---|---|
| RF-21 | Una fila (carrusel) por cada `Categoria` de `Enlaces`, en el orden de `Orden_Categoria` o, si no existe, en el orden de aparición. | M |
| RF-22 | **Reproductor modal**: incrusta el video (`/embed/ID`) o la lista (`/embed/videoseries?list=ID`) desde `youtube-nocookie.com`, con el título y el botón **Ver en YouTube**. | S |
| RF-23 | Si YouTube devuelve un error de incrustación (101/150) o el video no existe (100), el reproductor dice "Este video solo puede verse en YouTube" y destaca el botón. | S |
| RF-24 | Miniatura automática: si `URL_Miniatura` está vacía y la URL es de un video, usar `https://i.ytimg.com/vi/<ID>/hqdefault.jpg`. Si es una lista sin miniatura, usar el placeholder. | M |
| RF-25 | Aceptar como URL de YouTube: `youtu.be/ID`, `youtube.com/watch?v=ID`, `/shorts/ID`, `/live/ID`, `/embed/ID` y `playlist?list=ID`, con o sin parámetros extra (`si=`, `t=`). | M |
| RF-26 | Buscador por título sobre todo el catálogo cargado, sin servidor. | C |

### Comunidad y pie
| ID | Requerimiento | Prio. |
|---|---|---|
| RF-27 | Formulario **Sugerencias y preguntas** con nombre (opcional), tipo de consulta (obligatorio: *Comentarios y sugerencias de mejoras*, *Preguntas*, *Informes de errores (links rotos)*, *Contenido que quieres que se agregue*) y mensaje (obligatorio, máx. 1000 caracteres). | S |
| RF-28 | El formulario valida antes de enviar, envía a Google Forms (decisión D1), confirma el envío, bloquea el doble envío y ofrece un enlace de reserva si falla. | S |
| RF-29 | Sección **Agradecimientos & Créditos** con la lista de `Creditos` (enlazada si tiene URL). | M |
| RF-30 | Pie con aviso de sitio fan no oficial, agradecimiento a los equipos de subtítulos, el año en curso y @SVTFLIX_ESP. | M |

### Imágenes
| ID | Requerimiento | Prio. |
|---|---|---|
| RF-31 | Todas las `<img>` tienen un `onerror` que las cambia una sola vez por el placeholder neutro, sin bucles. | M |
| RF-32 | Las imágenes que quedan fuera de pantalla se cargan con `loading="lazy"` y llevan `width` y `height` para que la página no salte. | M |

## 3. Requerimientos no funcionales (RNF)

| ID | Categoría | Requerimiento | Cómo se comprueba |
|---|---|---|---|
| RNF-01 | Coste | 0 €/mes: Vercel Hobby, Google Sheets, Google Forms, GitHub gratis. | Revisión de servicios |
| RNF-02 | Arquitectura | Sin backend, sin base de datos y sin cuentas de usuario. | Revisión de código |
| RNF-03 | Rendimiento | LCP < 2,5 s y CLS < 0,1 en móvil 4G. Lighthouse móvil: Rendimiento ≥ 80, el resto ≥ 90. | Lighthouse / PageSpeed |
| RNF-04 | Rendimiento | El iframe del hero se carga **después** de pintar el póster. JS propio < 50 KB comprimido. | Pestaña Network |
| RNF-05 | Responsive | Se ve bien de 360 px a 1920 px y se prueba en 1366×768. Botones táctiles de 44 px como mínimo. | DevTools + móvil real |
| RNF-06 | Compatibilidad | Últimas 2 versiones de Chrome, Firefox, Edge y Safari (incluido iOS). | Pruebas manuales |
| RNF-07 | Accesibilidad | WCAG 2.2 AA básico: contraste ≥ 4.5:1, foco visible, `alt` en imágenes, modales con `role="dialog"`, `prefers-reduced-motion` respetado. | Lighthouse + axe + teclado |
| RNF-08 | Frescura | Un cambio en la hoja aparece en la web en ≤ 10 min (lo que tarda Google), sin redesplegar. | Prueba manual |
| RNF-09 | Disponibilidad | Si Google Sheets no responde, la web muestra la última copia guardada o un mensaje, nunca una página en blanco. | Simular sin red |
| RNF-10 | Seguridad | Los datos de la hoja se insertan como texto (`textContent`), solo se aceptan URLs `https:`, la CSP limita scripts y frames a YouTube, Google y el propio sitio, y los enlaces externos llevan `rel="noopener"`. | Revisión de código + cabeceras |
| RNF-11 | Privacidad | Sin cookies propias ni analítica con rastreo. Reproductor `youtube-nocookie`. En la hoja pública no hay datos personales. El formulario no pide email. | Revisión |
| RNF-12 | Mantenibilidad | Las URLs de las pestañas están en un solo archivo (`config.js`). Módulos pequeños y comentados en español. Commits en español con Gitflow. | Revisión de código |
| RNF-13 | Usabilidad (admin) | Una persona no técnica puede añadir un video en < 2 min siguiendo la guía de la hoja. | Prueba con una admin |
| RNF-14 | Diseño | Estructura de plataforma de streaming con identidad propia: profundidad (capas, sombras, luces), tipografía con carácter y microinteracciones suaves. Sin logo, tipografía ni nombre de Netflix. | Revisión de diseño |
| RNF-15 | Legal | Aviso de sitio fan no oficial y créditos visibles en todas las páginas. | Revisión |
| RNF-16 | SEO / compartir | `<title>`, descripción, Open Graph e imagen para redes, favicon, `lang="es"` y contenido mínimo en `<noscript>`. | Previsualizar el enlace en X o WhatsApp |

## 4. Reglas de negocio (RN)

| ID | Regla |
|---|---|
| RN-01 | La relación integrante ↔ Música/Programas se hace por la columna `Miembro`, comparada **normalizada**: sin puntos, espacios, tildes ni mayúsculas. Así `S.COUPS`, `s coups` y `Scoups` coinciden. Se recomienda usar el `ID` de `Miembros`. |
| RN-02 | Se muestran los integrantes que haya en la hoja, ordenados por `Numero`. Si no son 13, se avisa en consola sin romper nada. |
| RN-03 | Una fila del catálogo sin elementos válidos no se muestra. |
| RN-04 | Un elemento sin `Titulo` o sin URL válida se ignora y se avisa en consola indicando pestaña y fila. |
| RN-05 | Las URLs que no son de YouTube en `Enlaces` se abren en pestaña nueva, no en el reproductor. |
| RN-06 | Si hay varias filas en `Portada`, se usa la primera con `Activo` distinto de `No`. |

## 5. Modelo de datos (Google Sheets)

Una hoja con **7 pestañas**. Cada pestaña se publica como CSV en *Archivo → Compartir → Publicar en la web → [pestaña] → CSV*.
Las columnas marcadas **(nuevo)** no estaban en la especificación original.

### 5.1 `Portada`
| Columna | Tipo | Oblig. | Ejemplo |
|---|---|---|---|
| Titulo_Album | Texto | Sí | DREAMSCAPE |
| Subtitulo **(nuevo)** | Texto | No | JEONGHAN X JOSHUA 1st Mini Album |
| URL_Logo **(nuevo)** | URL imagen PNG transparente | No | /img/portada/dreamscape-logo.png |
| URL_Video_Teaser | URL YouTube | Sí | https://youtu.be/oyubak3kMFE |
| URL_Poster **(nuevo)** | URL imagen 16:9 | Sí | /img/portada/dreamscape-poster.jpg |
| URL_Boton_Principal **(nuevo)** | URL YouTube | Sí | https://youtu.be/hdwGWGSfABA |
| Texto_Boton_Secundario | Texto | No | Nuevo Álbum |
| URL_Boton_Secundario **(nuevo)** | URL | No | (lista o enlace del álbum) |
| Activo **(nuevo)** | Sí/No | No | Sí |

### 5.2 `Miembros`
| Columna | Tipo | Oblig. | Ejemplo |
|---|---|---|---|
| ID **(nuevo)** | texto corto, sin espacios | Sí | hoshi |
| Numero | Entero 1–13 | Sí | 5 |
| Nombre | Texto | Sí | HOSHI |
| Subunidad | Texto | Sí | Performance Team |
| Rol **(nuevo)** | Texto | No | Líder |
| URL_Foto | URL imagen 2:3 | Sí | /img/miembros/hoshi.jpg |
| Foto_Fondo | URL imagen 16:9 | No | /img/miembros/hoshi-fondo.jpg |
| Biografia | Texto largo | No | … |
| Nombre_Real | Texto | No | Kwon Soon-young |
| Fecha_Nacimiento | Texto (DD/MM/AAAA) | No | 15/06/1996 |
| Lugar_Nacimiento | Texto | No | Namyangju, Corea del Sur |
| Estatura | Texto | No | 178 cm |
| Signo | Texto | No | Géminis |
| Emoji | Texto | No | 🐯 |
| Instagram | URL | No | https://www.instagram.com/… |

### 5.3 `Enlaces` (catálogo)
| Columna | Tipo | Oblig. | Ejemplo |
|---|---|---|---|
| Categoria | Texto | Sí | Predebut |
| Orden_Categoria **(nuevo)** | Entero | No | 2 |
| Titulo | Texto | Sí | Seventeen TV |
| URL_Video | URL YouTube (video **o lista**) | Sí | https://www.youtube.com/playlist?list=… |
| URL_Miniatura | URL imagen 16:9 | No (sí para listas) | /img/catalogo/seventeen-tv.jpg |
| Descripcion **(nuevo)** | Texto | No | "La mayoría no incluye subtítulos…" |
| Orden **(nuevo)** | Entero | No | 1 |
| Activo **(nuevo)** | Sí/No | No | Sí |

Categorías actuales en Canva (para migrar): **Música** (Videos Musicales, Dance Practice, Fanchats, Special Video…), **Predebut** (Seventeen TV, Pre-Debut Film, Good Morning 17, 17 Project), **Contenido Diverso** (Detrás de Cámaras, Entretenimiento, Variety, Japón…), **Going Seventeen** (GOSE 2017, 2018 Spin Off, 2019, 2020…), **Proyecciones** (Conciertos, Caratland, FanMeetings Japón, Documentales y Películas…). Las filas con flecha tienen más elementos que hay que inventariar en la Fase 0.

### 5.4 `Musica` y 5.5 `Programas`
| Columna | Tipo | Oblig. | Ejemplo |
|---|---|---|---|
| Miembro | ID o nombre del integrante | Sí | hoshi |
| Titulo | Texto | Sí | Spider |
| URL_Video | URL YouTube | Sí | https://youtu.be/… |
| URL_Miniatura **(nuevo)** | URL | No | — |
| Orden **(nuevo)** | Entero | No | 1 |

### 5.6 `Redes` **(nueva pestaña)**
| Columna | Tipo | Oblig. | Ejemplo |
|---|---|---|---|
| Seccion | `Cabecera` / `Sigue` / `Escucha` | Sí | Sigue |
| Nombre | Texto | Sí | Instagram |
| URL | URL | Sí | https://www.instagram.com/saythename_17/ |
| Icono | clave de icono (`x`, `instagram`, `youtube`, `web`, `weverse`, `tiktok`, `spotify`, `apple-music`, `youtube-music`) o URL de imagen | Sí | instagram |
| Orden | Entero | No | 2 |

### 5.7 `Creditos` **(nueva pestaña)**
| Columna | Tipo | Oblig. | Ejemplo |
|---|---|---|---|
| Nombre | Texto | Sí | Seventeen Sub Español |
| URL | URL | No | — |
| Tipo | `Creadora` / `Diseño` / `Subtítulos` / `Otros` | No | Subtítulos |
| Orden | Entero | No | — |

## 6. Trazabilidad

| RF | HU | CU |
|---|---|---|
| RF-01 a RF-06 | HU-23, HU-26, HU-28 | CU-01 |
| RF-07 a RF-11 | HU-01, HU-02, HU-03 | CU-02, CU-07 |
| RF-12 a RF-14 | HU-04, HU-05 | CU-03 |
| RF-15 a RF-19 | HU-06, HU-07, HU-08, HU-09 | CU-04, CU-07 |
| RF-20 | HU-14, HU-15 | CU-08 |
| RF-21 a RF-25 | HU-10, HU-11, HU-12 | CU-05, CU-07 |
| RF-26 | HU-13 | CU-06 |
| RF-27, RF-28 | HU-16 | CU-09 |
| RF-29, RF-30 | HU-17, HU-18 | CU-10 |
| RF-31, RF-32 | HU-27 | CU-01 (incluido) |
| — (proceso) | HU-19 a HU-22, HU-24 | CU-11 |
| — (proceso) | HU-29 | CU-12 |
