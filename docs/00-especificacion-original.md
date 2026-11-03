# ESPECIFICACIONES TÉCNICAS Y REQUERIMIENTOS DE SOFTWARE

## Proyecto: SVTFLIX (Plataforma Web Estilo Netflix para SEVENTEEN)

---

## 1\. RESUMEN EJECUTIVO Y OBJETIVO

El objetivo general del proyecto es desarrollar una aplicación web de entretenimiento con la identidad visual de **Netflix**, adaptada conceptualmente para el grupo musical **SEVENTEEN (SVTFLIX)**.

El requerimiento central de arquitectura es implementar un sistema **Headless CMS sin costo de infraestructura**, donde toda la información (integrantes, portadas, catálogo de videos, música y series) sea gestionada en tiempo real mediante una hoja de cálculo en **Google Sheets**. El despliegue se mantendrá sincronizado de forma continua mediante **GitHub** y **Vercel**.

---

## 2\. STACK TECNOLÓGICO Y ARQUITECTURA

* **Frontend:** HTML5 Semántico, Tailwind CSS (para estilos nativos oscuros y responsivos) y JavaScript Vanilla (ES6+).  
* **Gestor de Contenidos (CMS):** Google Sheets (Publicado como CSV dinámico).  
* **Parser de Datos:** PapaParse / Fetch API con normalización nativa de encabezados.  
* **Control de Versiones:** Git y **GitHub** (Repositorio de código fuente).  
* **Hosting y Despliegue:** **Vercel** (Certificado SSL gratuito, despliegue continuo en CI/CD y dominio gratuito `.vercel.app`).

---

## 3\. ESTRUCTURA Y MODELADO DE DATOS (CMS EN GOOGLE SHEETS)

La base de datos en Google Sheets constará de **5 pestañas estándar**. El backend/frontend procesará estos datos mediante peticiones `fetch`.

### 3.1. Pestaña 1: `Portada` (Banner Hero)

Define el contenido promocional principal de la cabecera.

* `Titulo_Album` *(Texto)*: Título del comeback o lanzamiento activo.  
* `Texto_Boton_Secundario` *(Texto)*: Etiqueta del botón de acción secundario.  
* `URL_Video_Teaser` *(URL)*: Enlace directo a YouTube para el video promocional en bucle.

### 3.2. Pestaña 2: `Miembros` (Sección Top 13\)

Controla la información de los 13 integrantes de SEVENTEEN.

* `Numero` *(Entero 1-13)*: Posición en el ranking Top.  
* `Nombre` *(Texto)*: Nombre artístico (ej. S.COUPS, JEONGHAN).  
* `Subunidad` *(Texto)*: HipHop Team, Vocal Team, Performance Team.  
* `URL_Foto` *(URL)*: Enlace a la imagen vertical (ratio 2:3) para el carrusel.  
* `Biografia` *(Texto)*: Descripción biográfica del integrante.  
* `Nombre_Real` *(Texto)*: Nombre completo de nacimiento.  
* `Fecha_Nacimiento` *(Texto/Fecha)*: Fecha de cumpleaños.  
* `Lugar_Nacimiento` *(Texto)*: Ciudad/País de origen.  
* `Estatura` *(Texto)*: Estatura en cm.  
* `Signo` *(Texto)*: Signo zodiacal.  
* `Emoji` *(Texto)*: Emoji representativo.  
* `Instagram` *(URL)*: Enlace al perfil oficial de Instagram.  
* `Foto_Fondo` *(URL)*: Imagen de cabecera horizontal para el modal de detalles.

### 3.3. Pestaña 3: `Enlaces` (Catálogo Multimedia)

Clasifica los videos generales por categorías de visualización.

* `CATEGORIA` *(Texto)*: Nombre de la sección (ej. Variedades, Conciertos, MV).  
* `TITULO` *(Texto)*: Nombre del video o episodio.  
* `URL_Video` *(URL)*: Enlace de reproducción (YouTube).  
* `URL_Miniatura` *(URL \- Opcional)*: Imagen del video. *Regla:* Si está vacía, el sistema auto-generará la miniatura oficial de YouTube (`hqdefault.jpg`).

### 3.4. Pestañas 4 y 5: `Musica` y `Programas` (Filtros por Integrante)

Asocian contenido individual a la ficha de cada miembro.

* `Miembro` *(Texto)*: Nombre clave coincidente con la pestaña `Miembros`.  
* `Titulo` *(Texto)*: Nombre de la canción, solo, subunidad o programa.  
* `URL_Video` *(URL)*: Enlace de YouTube.

---

## 4\. REQUERIMIENTOS FUNCIONALES

1. **Consumo Dinámico Asíncrono:** La aplicación debe procesar las 5 URLs de CSV publicadas en Google Sheets al iniciar (`DOMContentLoaded`), utilizando un parser con resiliencia a tildes, mayúsculas, minúsculas y espacios en los encabezados.  
2. **Carrusel "Top 13" con Maquetación Estilo Netflix:**  
   * Desplazamiento horizontal continuo con botones de control lateral.  
   * **Visualización de Números Gigantes:** Implementación mediante capas CSS Grid / z-index independientes donde el número de posición se ubica en capa inferior (`z-index: 1`) a la izquierda, permitiendo que la tarjeta del integrante (`z-index: 2`) cubra exactamente el lateral derecho del número sin desalineaciones ni deformaciones.  
3. **Modal Interactivo Multi-sección:** Al hacer clic en un integrante, se despliega una ventana emergente que filtra automáticamente su información biográfica, discografía individual (Pestaña `Musica`) y participaciones en programas (Pestaña `Programas`).  
4. **Reproductor Banner Autoplay:** Integración del video principal de la pestaña `Portada` silenciado y en bucle continuo en el Hero de la web.  
5. **Fallback de Imágenes Caídas:** Implementación del evento `onerror` en todas las etiquetas de imagen para reemplazar automáticamente enlaces rotos por una imagen de reserva (*placeholder* neutral).

---

## 5\. PLAN DE TRABAJO Y ENTREGABLES

* **Fase 1: Configuración de Entorno y CI/CD**  
  * Creación del repositorio en GitHub.  
  * Vinculación de despliegues automáticos en Vercel.  
  * Estructuración inicial de archivos (`index.html`, `styles.css`, `script.js`).  
* **Fase 2: Motor de Datos y Parseo CSV**  
  * Script de conexión asíncrona a Google Sheets.  
  * Normalizador de campos de entrada.  
* **Fase 3: Maquetación Visual y Top 13**  
  * Integración de Tailwind CSS.  
  * Desarrollo del grid/carrusel Top 13 con súper-posición precisa de números.  
* **Fase 4: Componentes Interactivos y Modales**  
  * Lógica de modales dinámicos.  
  * Filtros de música y programas por integrante.  
* **Fase 5: QA, Optimización y Despliegue Final**  
  * Pruebas de velocidad de carga y adaptación móvil (*Responsive*).  
  * Verificación de producción en Vercel.