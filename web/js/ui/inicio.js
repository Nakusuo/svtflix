/**
 * Página de inicio: portada, Top 13, redes, filas del catálogo y créditos.
 */
import { el, urlSegura } from '../seguro.js';
import { alCambiarMiLista, miLista } from '../mi-lista.js';
import { agrupar, anclaDe, fila, mensajeVacio, titular } from './comunes.js';
import { icono } from './iconos.js';
import { registrarVistaPrevia } from './vista-previa.js';

const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Portada (RF-08 a RF-10) ----------

export function pintarPortada(contenedor, filas) {
  const p = filas?.[0];
  if (!p) {
    contenedor.replaceChildren(mensajeVacio('No se pudo cargar la portada.'));
    return;
  }
  const poster = urlSegura(p.url_poster);
  const video = urlSegura(p.url_video_fondo);
  const logo = urlSegura(p.url_logo);
  const principal = urlSegura(p.url_boton_principal);
  const secundario = urlSegura(p.url_boton_secundario);

  /*
    Un solo bloque de imagen/video que cambia de sitio según la pantalla:
    - Móvil: dentro de una tarjeta redondeada, arriba y en formato 16:10 (como la portada de Netflix en el móvil).
    - Escritorio (sm+): ocupa toda la portada detrás del texto.
  */
  // En móvil el borde inferior se desvanece con una máscara (sin corte) sobre el fondo de ambiente.
  const medio = el('div', { class: 'relative aspect-[16/10] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] sm:absolute sm:inset-0 sm:-z-10 sm:aspect-auto sm:[mask-image:none]' },
    poster && el('img', { src: poster, alt: '', class: 'absolute inset-0 h-full w-full object-cover', fetchpriority: 'high' }));

  // El video entra después del póster y solo si el usuario no pidió reducir movimiento (RF-09).
  if (video && !reducirMovimiento()) {
    const v = el('video', {
      src: video, poster: poster || null, muted: true, autoplay: true, loop: true, playsinline: true, preload: 'auto',
      'aria-hidden': 'true', class: 'absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000',
    });
    v.muted = true; // necesario para que el navegador permita el autoplay
    v.addEventListener('playing', () => v.classList.remove('opacity-0'), { once: true });
    medio.append(v);
  }
  medio.append(
    // Móvil: la "S" arriba a la izquierda, como la "N" de Netflix
    el('img', { src: 'img/logo-s.svg', alt: '', width: 40, height: 70, class: 'absolute left-3 top-3 h-7 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,.7)] sm:hidden' }),
  );

  const botones = el('div', { class: 'mt-4 grid w-full grid-cols-2 gap-2 sm:mt-0 sm:flex sm:w-auto sm:gap-3' },
    principal && el('a', {
      href: principal, target: '_blank', rel: 'noopener',
      class: 'inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-texto px-4 font-bold text-fondo shadow-xl shadow-black/40 transition hover:bg-white hover:shadow-rosa/20 active:scale-95 sm:px-6',
    }, icono('play', 'size-5'), 'Reproducir'),
    secundario && p.texto_boton_secundario && el('a', {
      href: secundario, target: '_blank', rel: 'noopener',
      class: 'inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-white/15 px-4 font-bold text-texto ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25 active:scale-95 sm:px-6',
      texto: p.texto_boton_secundario,
    }));
  // Si solo hay un botón, que ocupe todo el ancho en el móvil
  if (botones.children.length === 1) botones.firstElementChild.classList.add('col-span-2');

  const texto = el('div', { class: 'relative -mt-16 flex flex-col items-center px-4 pb-4 text-center animate-[aparecer_.8s_ease-out_both] sm:mt-0 sm:max-w-md sm:items-start sm:px-0 sm:pb-0 sm:text-left' },
    el('p', { class: 'mb-2 hidden text-xs font-bold uppercase tracking-[0.35em] text-rosa sm:block', texto: 'Nuevo lanzamiento' }),
    logo
      ? el('img', { src: logo, alt: p.titulo_album, width: 526, height: 526, class: 'mb-1 w-32 drop-shadow-[0_4px_24px_rgba(0,0,0,.7)] sm:mb-3 sm:w-56' })
      : el('h1', { class: 'mb-2 font-display text-5xl uppercase sm:text-6xl', texto: p.titulo_album }),
    logo && el('h1', { class: 'sr-only', texto: p.titulo_album }),
    // Móvil: etiqueta roja como el "Recién agregado" de Netflix
    el('span', { class: 'mb-2 rounded-sm bg-acento px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white shadow-md shadow-black/40 sm:hidden', texto: 'Nuevo lanzamiento' }),
    p.subtitulo && el('p', { class: 'text-[0.8rem] font-semibold text-texto/85 sm:mb-6 sm:text-sm sm:uppercase sm:tracking-widest', texto: p.subtitulo }),
    botones);

  contenedor.replaceChildren(
    // Tarjeta (solo en móvil; en escritorio sus estilos desaparecen y todo queda a pantalla completa)
    el('div', { class: 'relative isolate overflow-hidden rounded-xl bg-superficie shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:static sm:isolation-auto sm:overflow-visible sm:rounded-none sm:bg-transparent sm:shadow-none sm:ring-0' },
      // Móvil: fondo de ambiente con el póster difuminado
      poster && el('img', { src: poster, alt: '', 'aria-hidden': 'true', class: 'absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-35 blur-2xl saturate-150 sm:hidden' }),
      medio,
      texto),
    // Escritorio: degradados para que el texto se lea sobre el video
    el('div', { class: 'absolute inset-0 -z-10 hidden bg-gradient-to-r from-fondo/90 via-fondo/30 to-transparent sm:block', 'aria-hidden': 'true' }),
    el('div', { class: 'absolute inset-0 -z-10 hidden bg-gradient-to-t from-fondo via-transparent to-fondo/40 sm:block', 'aria-hidden': 'true' }),
  );
}

// ---------- Top 13 (RF-12 a RF-14) ----------

function tarjetaTop(m) {
  const numero = String(m.numero || '');
  const etiqueta = [m.rol, m.subunidad?.replace(' Team', '')].filter(Boolean).join(' · ');
  const item = el('a', {
    href: `#/miembro/${encodeURIComponent(m.id)}`,
    class: 'top13 group/m snap-start',
    'aria-label': `${m.nombre}, ${etiqueta}`,
  },
  el('span', { class: 'top13-numero', 'aria-hidden': 'true', texto: numero }),
  el('div', { class: 'top13-tarjeta overflow-hidden rounded-md bg-superficie shadow-2xl shadow-black/60 ring-1 ring-white/10 transition duration-300 group-hover/m:-translate-y-1.5 group-hover/m:ring-rosa/60 group-focus-visible/m:ring-rosa' },
    el('img', {
      src: urlSegura(m.url_foto), alt: '', loading: 'lazy', width: 600, height: 889,
      class: 'aspect-[2/3] w-full object-cover transition duration-500 group-hover/m:scale-105',
    }),
    el('div', { class: 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-8 text-center' },
      el('p', { class: 'text-[0.6rem] font-bold uppercase tracking-widest text-rosa', texto: etiqueta }),
      el('p', { class: 'font-display text-sm tracking-wide', texto: m.nombre }))));
  item.style.setProperty('--cifras', numero.length || 1);
  // Al pasar el ratón: su clip de video, como las vistas previas de Netflix
  registrarVistaPrevia(item.querySelector('.top13-tarjeta'), {
    titulo: m.nombre,
    imagen: urlSegura(m.foto_fondo) || urlSegura(m.url_foto),
    video: urlSegura(m.video_fondo),
    destino: `#/miembro/${encodeURIComponent(m.id)}`,
    masInfo: `#/miembro/${encodeURIComponent(m.id)}`,
    etiqueta: `Top ${numero}`,
    meta: [m.subunidad, m.signo, m.fecha_nacimiento],
  });
  return item;
}

export function pintarTop13(contenedor, miembros) {
  if (!miembros?.length) {
    contenedor.replaceChildren(titular('Conoce a los 13 miembros', 'titulo-miembros'), mensajeVacio('No se pudieron cargar los integrantes.'));
    return;
  }
  const ordenados = [...miembros].sort((a, b) => Number(a.numero) - Number(b.numero));
  const seccion = fila('Conoce a los 13 miembros', ordenados, tarjetaTop, 'titulo-miembros');
  // Se monta un poco sobre el final de la portada, como en las apps de streaming.
  seccion.classList.add('relative', 'z-10', 'sm:-mt-16');
  contenedor.replaceWith(Object.assign(seccion, { id: 'miembros' }));
}

// ---------- Redes (RF-20) ----------

export function pintarRedes(datos) {
  const redes = datos.redes || [];
  const carat = redes.find((r) => r.seccion === 'Cabecera');
  const enlaceCarat = document.getElementById('enlace-carat');
  if (carat && urlSegura(carat.url)) enlaceCarat.href = urlSegura(carat.url);

  document.querySelectorAll('[data-seccion-redes]').forEach((lista) => {
    const items = redes.filter((r) => r.seccion === lista.dataset.seccionRedes && urlSegura(r.url));
    lista.replaceChildren(...items.map((r) => el('li', {},
      el('a', {
        href: urlSegura(r.url), target: '_blank', rel: 'noopener',
        class: 'inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-superficie px-4 text-sm font-semibold ring-1 ring-white/10 transition active:scale-95 hover:-translate-y-0.5 hover:bg-superficie-alta hover:ring-rosa/50',
      }, r.nombre, icono('externo', 'size-3.5 text-texto-suave')))));
  });
}

// ---------- Catálogo (RF-21) ----------

export function pintarCatalogo(contenedor, enlaces) {
  // "Mi lista" va primero y se repinta sola cada vez que alguien añade o quita algo.
  const ranuraMiLista = el('div');
  const pintarMiLista = () => {
    ranuraMiLista.replaceChildren(fila('Mi lista', miLista()) || '');
    document.querySelector('[data-nav="mi-lista"]')?.toggleAttribute('hidden', !miLista().length);
  };
  alCambiarMiLista(pintarMiLista);
  pintarMiLista();

  if (!enlaces?.length) {
    contenedor.replaceChildren(ranuraMiLista, mensajeVacio('No se pudo cargar el catálogo.'));
    return;
  }
  const ordenados = [...enlaces].sort((a, b) => (Number(a.orden_categoria) || 99) - (Number(b.orden_categoria) || 99));
  const filas = [...agrupar(ordenados, 'categoria')].map(([categoria, items]) => fila(categoria, items));
  contenedor.replaceChildren(ranuraMiLista, ...filas.filter(Boolean));
}

// ---------- Navegación con pastillas (como la de Netflix) ----------

export function pintarNavegacion(nav, enlaces) {
  if (!nav) return;
  const categorias = [...new Set([...(enlaces || [])]
    .sort((a, b) => (Number(a.orden_categoria) || 99) - (Number(b.orden_categoria) || 99))
    .map((e) => e.categoria).filter(Boolean))];
  const pastilla = (texto, href, extra = {}) => el('a', {
    href, ...extra,
    class: 'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-texto/75 transition hover:text-white data-[activa]:bg-white/15 data-[activa]:text-white',
    texto,
  });
  const pastillas = [
    pastilla('Inicio', '#', { 'data-ancla': 'portada' }),
    pastilla('Integrantes', '#miembros', { 'data-ancla': 'miembros' }),
    ...categorias.map((c) => pastilla(c, `#${anclaDe(c)}`, { 'data-ancla': anclaDe(c) })),
    pastilla('Mi lista', `#${anclaDe('Mi lista')}`, { 'data-ancla': anclaDe('Mi lista'), 'data-nav': 'mi-lista', hidden: !miLista().length }),
  ];
  nav.replaceChildren(...pastillas);

  // Marca la sección que está a la vista
  const marcar = (id) => pastillas.forEach((p) => p.toggleAttribute('data-activa', p.dataset.ancla === id));
  marcar('portada');
  const observador = new IntersectionObserver((entradas) => {
    entradas.filter((e) => e.isIntersecting).forEach((e) => marcar(e.target.id));
  }, { rootMargin: '-35% 0px -60% 0px' });
  const observar = () => pastillas.forEach((p) => {
    const objetivo = document.getElementById(p.dataset.ancla);
    if (objetivo) observador.observe(objetivo);
  });
  observar();
  alCambiarMiLista(() => setTimeout(observar));
}

// ---------- Créditos (RF-29) ----------

export function pintarCreditos(contenedor, creditos) {
  if (!creditos?.length) return;
  const partes = creditos.flatMap((c, i) => {
    const url = urlSegura(c.url);
    const nombre = url
      ? el('a', { href: url, target: '_blank', rel: 'noopener', class: 'whitespace-nowrap underline hover:text-rosa', texto: c.nombre })
      : el('span', { class: 'whitespace-nowrap', texto: c.nombre });
    // El ✦ va pegado (espacio duro) al nombre anterior y la línea solo se parte después de él,
    // así nunca empieza una línea con ✦ ni se corta un nombre por la mitad.
    return i ? ['\u00a0', el('span', { class: 'text-rosa/70', 'aria-hidden': 'true', texto: '✦' }), ' ', nombre] : [nombre];
  });
  contenedor.replaceChildren(...partes);
}
