/**
 * Piezas que se repiten: tarjeta de contenido, fila con carrusel y titular de sección.
 */
import { IMAGEN_RESERVA } from '../config.js';
import { el, urlSegura } from '../seguro.js';
import { infoYouTube, miniaturaYouTube } from '../youtube.js';
import { icono } from './iconos.js';

export function titular(texto, id) {
  return el('h2', { id, class: 'mb-1 font-display text-[1.05rem] uppercase tracking-wide sm:mb-2 sm:text-2xl', texto });
}

/**
 * Tarjeta 16:9 para un video, lista, documento o página interna.
 * Por ahora abre YouTube en otra pestaña; el reproductor propio llega en la Fase 4.
 */
export function tarjeta(item, { ancho = 'w-[40vw] max-w-72 sm:w-72' } = {}) {
  const url = urlSegura(item.url_video);
  const yt = infoYouTube(url);
  const miniatura = urlSegura(item.url_miniatura) || miniaturaYouTube(yt) || IMAGEN_RESERVA;
  const interna = item.pagina ? `#/pagina/${encodeURIComponent(item.pagina)}` : '';
  const destino = interna || url;
  if (!destino) return null;

  const etiqueta = item.plataforma && item.plataforma !== 'YouTube' ? item.plataforma : yt?.tipo === 'lista' ? 'Lista' : '';

  return el('a', {
    href: destino,
    target: interna ? null : '_blank',
    rel: interna ? null : 'noopener',
    class: `group/t relative block shrink-0 snap-start ${ancho} overflow-hidden rounded-md bg-superficie ring-1 ring-white/5 shadow-lg shadow-black/40 transition duration-300 active:scale-[.97] active:duration-100 hover:-translate-y-1 hover:ring-rosa/50 hover:shadow-rosa/10 focus-visible:-translate-y-1`,
  },
  el('img', {
    src: miniatura, alt: '', loading: 'lazy', decoding: 'async', width: 640, height: 360,
    class: 'aspect-video w-full object-cover transition duration-500 group-hover/t:scale-105',
  }),
  etiqueta && el('span', {
    class: 'absolute right-1.5 top-1.5 rounded-sm bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-texto-suave backdrop-blur sm:right-2 sm:top-2 sm:text-[0.65rem]',
    texto: etiqueta,
  }),
  el('div', { class: 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2.5 pb-2 pt-8 sm:px-3 sm:pb-2.5 sm:pt-10' },
    el('p', { class: 'line-clamp-2 text-[0.8rem] font-semibold leading-snug sm:text-sm', texto: item.titulo || 'Sin título' })));
}

/** Fila horizontal con flechas (desaparecen al llegar a un extremo). */
export function fila(titulo, items, crear = tarjeta, id) {
  const tarjetas = items.map((i) => crear(i)).filter(Boolean);
  if (!tarjetas.length) return null;

  const pista = el('div', {
    class: 'flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-4 px-4 pb-4 pt-2 [scrollbar-width:none] sm:gap-3 sm:scroll-px-10 sm:px-10 sm:pb-5 [&::-webkit-scrollbar]:hidden',
  }, tarjetas);

  const flecha = (dir) => el('button', {
    type: 'button',
    'aria-label': dir < 0 ? `Anterior en ${titulo}` : `Siguiente en ${titulo}`,
    class: `flecha absolute inset-y-2 ${dir < 0 ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'} z-10 hidden w-12 items-center justify-center from-fondo via-fondo/80 to-transparent text-texto/80 opacity-0 transition hover:text-white group-hover/f:opacity-100 focus-visible:opacity-100 sm:flex`,
    onclick: () => pista.scrollBy({ left: dir * pista.clientWidth * 0.85 }),
  }, icono(dir < 0 ? 'izquierda' : 'derecha', 'size-8'));

  const izq = flecha(-1);
  const der = flecha(1);
  const actualizar = () => {
    izq.hidden = pista.scrollLeft < 8;
    der.hidden = pista.scrollLeft + pista.clientWidth > pista.scrollWidth - 8;
  };
  pista.addEventListener('scroll', actualizar, { passive: true });
  requestAnimationFrame(actualizar);

  return el('section', { class: 'py-1.5 sm:py-3', 'aria-label': titulo },
    el('div', { class: 'px-4 sm:px-10' }, titular(titulo, id)),
    el('div', { class: 'group/f relative' }, izq, pista, der));
}

/** Agrupa una lista por una clave conservando el orden de aparición. */
export function agrupar(lista, clave) {
  const grupos = new Map();
  for (const item of lista) {
    const k = item[clave] || '';
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(item);
  }
  return grupos;
}

export function mensajeVacio(texto) {
  return el('p', { class: 'px-4 py-3 text-sm text-texto-suave sm:px-10', texto });
}
