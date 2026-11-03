# SVTFLIX en Español — Historias de usuario

> Versión 0.1 · 2026-11-02 · Ver también [02-REQUERIMIENTOS](02-REQUERIMIENTOS.md)
>
> Formato: **Como** [rol] **quiero** [acción] **para** [beneficio].
> Criterios en **Dado / Cuando / Entonces**. Prioridad MoSCoW (M/S/C). Puntos de esfuerzo en Fibonacci (1, 2, 3, 5, 8).

## Resumen

| Épica | HU | Puntos |
|---|---|---|
| E1 Portada | HU-01 – HU-03 | 8 |
| E2 Integrantes | HU-04 – HU-09 | 20 |
| E3 Catálogo | HU-10 – HU-13 | 14 |
| E4 Redes | HU-14 – HU-15 | 2 |
| E5 Comunidad | HU-16 – HU-18 | 5 |
| E6 Gestión de contenido | HU-19 – HU-24 | 14 |
| E7 Calidad y plataforma | HU-25 – HU-30 | 15 |
| **Total** | **30 HU** | **78** |

---

## E1 · Portada

### HU-01 · Ver el lanzamiento destacado al entrar — M · 5 pts
**Como** CARAT **quiero** ver el teaser del último lanzamiento en movimiento al abrir la web **para** enterarme de lo nuevo nada más entrar.
- **Dado** que la pestaña `Portada` tiene un `URL_Video_Teaser` válido, **cuando** abro la web, **entonces** veo primero la imagen póster y después el teaser silenciado, en bucle y sin controles, ocupando el ancho de la pantalla.
- **Dado** que mi navegador bloquea el autoplay o tengo *reducir movimiento* activado, **cuando** abro la web, **entonces** se queda la imagen póster y la página no se ve rota.
- **Dado** que el video tarda en cargar, **cuando** aún no arranca, **entonces** el texto y los botones ya se pueden usar.

### HU-02 · Reproducir el video completo desde la portada — M · 2 pts
**Como** CARAT **quiero** pulsar *Reproducir* **para** ver el MV o video completo con sonido.
- **Dado** el hero cargado, **cuando** pulso *Reproducir*, **entonces** se abre el reproductor con el video de `URL_Boton_Principal` y con sonido.
- **Dado** que el video no se puede incrustar, **cuando** pulso *Reproducir*, **entonces** veo el aviso y el botón *Ver en YouTube*.

### HU-03 · Ir al contenido del nuevo álbum — S · 1 pt
**Como** CARAT **quiero** un segundo botón (p. ej. *Nuevo Álbum*) **para** ir al resto del contenido del lanzamiento.
- **Dado** que `Texto_Boton_Secundario` y `URL_Boton_Secundario` están rellenos, **cuando** cargo la web, **entonces** veo el botón con ese texto y, al pulsarlo, abre esa URL.
- **Dado** que alguno de los dos está vacío, **entonces** el botón no aparece.

## E2 · Integrantes

### HU-04 · Ver a los 13 integrantes en el Top 13 — M · 5 pts
**Como** CARAT nueva **quiero** ver a los 13 integrantes con foto, nombre y subunidad **para** empezar a reconocerlos.
- **Dado** la pestaña `Miembros`, **cuando** carga la web, **entonces** veo las tarjetas ordenadas del 1 al 13 con un número gigante detrás de cada una.
- **Dado** cualquier ancho de pantalla de 360 a 1920 px, **entonces** la tarjeta tapa exactamente el lado derecho de su número, sin solaparse con el número siguiente ni deformarse.
- **Dado** que una foto no carga, **entonces** aparece el placeholder y el nombre sigue visible.

### HU-05 · Moverme por el carrusel con comodidad — M · 3 pts
**Como** CARAT **quiero** pasar el carrusel con flechas, deslizando el dedo o con el teclado **para** ver a todos sin esfuerzo.
- **Dado** que estoy en escritorio, **cuando** paso el ratón por el carrusel, **entonces** aparecen las flechas laterales, y cada clic avanza aproximadamente una "página" de tarjetas con animación suave.
- **Dado** que estoy en móvil, **cuando** deslizo, **entonces** el carrusel se mueve con inercia y se ajusta a una tarjeta.
- **Dado** que uso el teclado, **cuando** llego con `Tab` a una tarjeta, **entonces** el carrusel la deja visible y el foco se ve claramente.
- **Dado** que estoy al principio o al final, **entonces** la flecha de ese lado se oculta.

### HU-06 · Ver la ficha de un integrante — M · 5 pts
**Como** CARAT **quiero** pulsar en un integrante y ver su ficha **para** conocer sus datos y su biografía.
- **Dado** el Top 13, **cuando** pulso o pulso `Enter` sobre una tarjeta, **entonces** se abre un modal con la foto de fondo, el nombre artístico, el emoji, el nombre real, la fecha y el lugar de nacimiento, la estatura, el signo, la biografía y el botón a Instagram.
- **Dado** que un dato está vacío en la hoja, **entonces** esa línea no se muestra, sin dejar huecos ni "undefined".
- **Dado** el modal abierto, **cuando** pulso X, `Esc` o fuera del modal, **entonces** se cierra y el foco vuelve a la tarjeta.
- **Dado** el modal abierto, **entonces** la página de detrás no hace scroll.

### HU-07 · Escuchar la música de un integrante — M · 3 pts
**Como** CARAT **quiero** ver en su ficha los solos, las unidades y las colaboraciones del integrante **para** escuchar su trabajo individual.
- **Dado** filas en `Musica` cuyo `Miembro` coincide (normalizado) con el integrante, **cuando** abro su ficha, **entonces** veo una fila *Música* con esas miniaturas y títulos.
- **Dado** que no hay ninguna, **entonces** la fila dice "Aún no hay contenido".
- **Cuando** pulso un elemento, **entonces** se abre el reproductor sobre la ficha y, al cerrarlo, vuelvo a la ficha.

### HU-08 · Ver los programas de un integrante — M · 2 pts
**Como** CARAT **quiero** ver los programas y apariciones del integrante **para** encontrar su contenido sin buscarlo en YouTube.
- Mismos criterios que HU-07, con la pestaña `Programas` y la fila *Programas*.

### HU-09 · Compartir la ficha de un integrante — C · 2 pts
**Como** CARAT **quiero** copiar un enlace que abra directamente la ficha de un integrante **para** mandárselo a una amiga.
- **Cuando** abro una ficha, **entonces** la URL cambia a `…/#miembro/hoshi`.
- **Dado** ese enlace, **cuando** lo abro en otro navegador, **entonces** la web carga y abre esa ficha.
- **Cuando** cierro la ficha o pulso *atrás*, **entonces** la URL vuelve a la normal.

## E3 · Catálogo

### HU-10 · Explorar el contenido por categorías — M · 5 pts
**Como** CARAT **quiero** ver el contenido en filas (Música, Predebut, Going Seventeen…) **para** encontrar rápido lo que busco.
- **Dado** la pestaña `Enlaces`, **cuando** carga la web, **entonces** hay una fila por cada `Categoria`, en el orden de `Orden_Categoria` o, si no existe, en el orden de aparición.
- **Dado** una fila con más elementos de los que caben, **entonces** se desplaza como el Top 13 (HU-05).
- **Dado** un elemento sin miniatura que es un video, **entonces** se usa la miniatura de YouTube. Si es una lista, se usa el placeholder.
- **Dado** un elemento con `Activo = No`, **entonces** no aparece.

### HU-11 · Ver un video o lista sin salir del sitio — S · 5 pts
**Como** CARAT **quiero** que el video se abra dentro de SVTFLIX **para** seguir navegando sin perderme en YouTube.
- **Cuando** pulso un elemento de YouTube, **entonces** se abre el reproductor con el título y el video o la lista empieza a reproducirse.
- **Dado** que es una lista, **entonces** el reproductor permite pasar de video dentro de ella.
- **Dado** que YouTube no permite incrustarlo (error 101/150) o el video ya no existe (100), **entonces** veo "Este video solo puede verse en YouTube" o "Este video ya no está disponible. ¡Avísanos!", con enlace al formulario.
- **Cuando** cierro el reproductor, **entonces** el video se detiene.

### HU-12 · Abrir el contenido en YouTube — M · 1 pt
**Como** CARAT **quiero** un botón *Ver en YouTube* **para** guardarlo en mis listas o verlo en la app.
- **Dado** el reproductor abierto, **entonces** siempre está el botón *Ver en YouTube*, que abre la URL original en pestaña nueva.

### HU-13 · Buscar por título — C · 3 pts
**Como** CARAT **quiero** escribir parte de un título **para** encontrar un video concreto.
- **Cuando** escribo 2 letras o más, **entonces** veo al instante los resultados de `Enlaces`, `Musica` y `Programas`, ignorando tildes y mayúsculas.
- **Dado** que no hay resultados, **entonces** veo "Sin resultados" y una sugerencia para pedirlo en el formulario.

## E4 · Redes

### HU-14 · Seguir a SEVENTEEN en sus redes — M · 1 pt
**Como** CARAT **quiero** tener a mano las redes oficiales **para** seguirlos.
- **Dado** filas `Seccion = Sigue` en `Redes`, **entonces** veo cada red con su icono y nombre, en el orden de `Orden`, y se abre en pestaña nueva.

### HU-15 · Escuchar a SEVENTEEN en mi plataforma — M · 1 pt
**Como** CARAT **quiero** enlaces a Spotify, Apple Music y YouTube Music **para** hacer streaming.
- Mismos criterios que HU-14, con `Seccion = Escucha`.

## E5 · Comunidad

### HU-16 · Enviar una sugerencia sin registrarme — S · 3 pts
**Como** CARAT **quiero** mandar una sugerencia, pregunta, reporte de link roto o petición de contenido **para** ayudar a mejorar la web.
- **Dado** el formulario, **cuando** intento enviar sin tipo de consulta o sin mensaje, **entonces** veo qué falta junto al campo, sin perder lo que escribí.
- **Dado** el formulario válido, **cuando** pulso *Enviar*, **entonces** el botón se desactiva, veo "¡Gracias! Lo leeremos pronto 💎" y el formulario se vacía.
- **Dado** que el envío falla, **entonces** veo un mensaje y un enlace para abrir el formulario original.
- **Dado** el envío, **entonces** la respuesta aparece en la hoja de respuestas privada del equipo.
- No se pide email ni ningún otro dato personal obligatorio.

### HU-17 · Ver los créditos de quienes subtitulan — M · 1 pt
**Como** parte de un equipo de fansubs **quiero** ver el nombre de mi equipo en los créditos **para** que se reconozca nuestro trabajo.
- **Dado** la pestaña `Creditos`, **entonces** la sección *Agradecimientos & Créditos* lista todos los nombres (enlazados si tienen URL), separados con ✦.

### HU-18 · Saber que es un sitio fan — M · 1 pt
**Como** visitante **quiero** ver claramente que es un sitio fan no oficial **para** no confundirlo con una plataforma oficial.
- **Dado** cualquier pantalla, **cuando** llego al pie, **entonces** veo el aviso de que los videos no son nuestros, el agradecimiento a los subers, el año en curso y @SVTFLIX_ESP.

## E6 · Gestión de contenido (admin)

### HU-19 · Cambiar la portada desde la hoja — M · 2 pts
**Como** admin **quiero** cambiar el álbum destacado editando la pestaña `Portada` **para** anunciar un comeback sin pedir ayuda a un programador.
- **Dado** que edito `Portada`, **cuando** pasan hasta 10 minutos, **entonces** la web muestra el nuevo título, póster, teaser y botones sin redesplegar.

### HU-20 · Gestionar videos y categorías desde la hoja — M · 3 pts
**Como** admin **quiero** añadir, editar, reordenar u ocultar videos y categorías en `Enlaces` **para** mantener el catálogo al día.
- **Cuando** añado una fila con una categoría nueva, **entonces** aparece una fila nueva en la web.
- **Cuando** pongo `Activo = No`, **entonces** el elemento desaparece sin borrarlo de la hoja.
- **Cuando** cambio `Orden`, **entonces** cambia el orden en la web.

### HU-21 · Editar los datos de los integrantes — M · 2 pts
**Como** admin **quiero** editar fotos, biografías y datos en `Miembros` **para** tenerlos actualizados.
- **Cuando** cambio un dato, **entonces** la ficha lo muestra en la siguiente carga, cuando Google actualice.

### HU-22 · Asociar música y programas a un integrante — M · 2 pts
**Como** admin **quiero** escribir el integrante en `Musica` o `Programas` **para** que salga en su ficha.
- **Dado** que escribo `hoshi`, `HOSHI` o `Hoshi`, **entonces** sale en la ficha de HOSHI.
- **Dado** que escribo un nombre que no existe, **entonces** no sale en ninguna ficha y la consola avisa con pestaña y fila.

### HU-23 · Que un despiste en la hoja no rompa la web — M · 3 pts
**Como** admin **quiero** que un error al escribir encabezados o celdas no tumbe la web **para** editar sin miedo.
- **Dado** el encabezado `Título Álbum ` (con tilde y espacios), **entonces** se reconoce como `Titulo_Album`.
- **Dado** que falta una columna obligatoria, **entonces** solo esa sección muestra un mensaje y el resto funciona.
- **Dado** una URL mal escrita, **entonces** ese elemento se omite y los demás se muestran.

### HU-24 · Tener una guía para editar la hoja — S · 2 pts
**Como** admin nueva **quiero** una pestaña o documento *Cómo editar* con ejemplos **para** no equivocarme.
- **Dado** la hoja, **entonces** existe una pestaña `LEEME` (no publicada) que explica cada pestaña, las columnas obligatorias, qué URL de YouTube sirve, cuánto tarda en verse un cambio y cómo ocultar sin borrar.
- Los encabezados están protegidos contra edición.

## E7 · Calidad y plataforma

### HU-25 · Usar la web cómodamente en el móvil — M · 3 pts
**Como** CARAT que entra desde el móvil **quiero** que todo se lea y se pulse bien **para** no tener que hacer zoom.
- **Dado** un ancho de 360 px, **entonces** no hay scroll horizontal de la página, los textos se leen sin zoom y los botones miden ≥ 44 px.
- **Dado** el hero en móvil, **entonces** el título y los botones no tapan las caras del póster (punto focal configurable por CSS).

### HU-26 · Que la web cargue rápido — S · 3 pts
**Como** CARAT con datos móviles **quiero** que la web aparezca rápido **para** no irme.
- **Dado** una conexión 4G, **entonces** el LCP es < 2,5 s.
- **Mientras** llegan los datos, **entonces** veo esqueletos con la forma de las tarjetas, no una pantalla en blanco.

### HU-27 · Ver un reemplazo cuando una imagen falla — M · 1 pt
**Como** CARAT **quiero** que las imágenes rotas se cambien por un placeholder **para** que la web no se vea descuidada.
- **Dado** una imagen con URL rota, **entonces** se cambia una sola vez por el placeholder neutro, sin parpadeos ni bucles.

### HU-28 · Seguir viendo la web si Google falla — S · 3 pts
**Como** CARAT **quiero** ver el contenido aunque Google Sheets no responda **para** no encontrarme la web vacía.
- **Dado** que ya visité la web antes y ahora Sheets no responde, **entonces** veo la última versión guardada.
- **Dado** que nunca la visité y Sheets no responde, **entonces** veo un mensaje amable con botón *Reintentar*.

### HU-29 · Desplegar al hacer push (desarrollador) — M · 2 pts
**Como** desarrollador **quiero** que cada push se despliegue solo **para** no subir archivos a mano.
- **Cuando** hago push a una rama, **entonces** Vercel crea una vista previa con su propia URL.
- **Cuando** fusiono a `main`, **entonces** se actualiza producción en `*.vercel.app` con HTTPS.
- **Dado** que la compilación de Tailwind falla, **entonces** el despliegue falla y producción se queda como estaba.

### HU-30 · Navegar con teclado o lector de pantalla — S · 3 pts
**Como** visitante que usa teclado o lector de pantalla **quiero** poder recorrer y usar todo **para** disfrutar del contenido igual que los demás.
- **Dado** el teclado, **entonces** puedo llegar a todos los enlaces, tarjetas y botones con `Tab`, el orden es lógico y el foco siempre se ve.
- **Dado** un lector de pantalla, **entonces** las tarjetas anuncian nombre y subunidad, los modales se anuncian como diálogo con título y los botones de icono tienen nombre accesible.
- Al principio de la página hay un enlace *Saltar al contenido*.
