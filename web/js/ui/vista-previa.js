/**
 * Vista previa al pasar el ratón, como en Netflix (solo con ratón; en móvil no se activa).
 *
 * Tras una pausa corta sobre una tarjeta aparece una ventana 1,5 veces más ancha que crece desde ella,
 * con imagen o video, botones (reproducir, Mi lista, más información) y una línea de datos.
 * Cada tarjeta se registra con registrarVistaPrevia(nodo, info).
 */
import { alternarMiLista, estaEnMiLista } from '../mi-lista.js';
import { el } from '../seguro.js';
import { icono } from './iconos.js';

const RETRASO_MS = 450;
const MARGEN = 12; // distancia mínima a los bordes de la ventana
const registro = new WeakMap();

/**
 * info = { titulo, imagen, video?, destino, externo?, masInfo?, meta: [texto], etiqueta?, item? }
 * item: el elemento de la hoja, si se puede guardar en Mi lista.
 */
export function registrarVistaPrevia(nodo, info) {
  registro.set(nodo, info);
  nodo.dataset.vistaPrevia = '';
}

const botonRedondo = (props, ...hijos) => el(props.href ? 'a' : 'button', {
  type: props.href ? null : 'button',
  ...props,
  class: `grid size-9 place-items-center rounded-full ring-2 transition active:scale-90 ${props.class || 'ring-white/40 text-texto hover:ring-white'}`,
}, ...hijos);

function construir(info) {
  const enlace = (extra = {}) => ({ href: info.destino, target: info.externo ? '_blank' : null, rel: info.externo ? 'noopener' : null, ...extra });

  const medio = el('a', enlace({ class: 'relative block aspect-video overflow-hidden bg-black', tabindex: '-1', 'aria-hidden': 'true' }),
    el('img', { src: info.imagen, alt: '', class: 'absolute inset-0 h-full w-full object-cover' }));

  let video = null;
  if (info.video && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video = el('video', {
      src: info.video, muted: true, autoplay: true, loop: true, playsinline: true, poster: info.imagen,
      class: 'absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500',
    });
    video.muted = true;
    video.addEventListener('playing', () => video.classList.remove('opacity-0'), { once: true });
    medio.append(video);
  }
  medio.append(
    el('div', { class: 'absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent' }),
    el('p', { class: 'absolute bottom-2 left-3 right-12 line-clamp-2 font-display text-lg uppercase leading-tight drop-shadow-lg', texto: info.titulo }));

  const botones = el('div', { class: 'flex items-center gap-2' },
    botonRedondo(enlace({ class: 'bg-texto text-fondo ring-texto hover:bg-white', 'aria-label': `Ver ${info.titulo}` }), icono('play', 'size-4 translate-x-px')));

  if (info.item) {
    const dentro = () => estaEnMiLista(info.item);
    const boton = botonRedondo({ 'aria-pressed': String(dentro()) });
    const pintar = () => {
      boton.replaceChildren(icono(dentro() ? 'hecho' : 'mas', 'size-4'));
      boton.setAttribute('aria-label', dentro() ? 'Quitar de Mi lista' : 'Añadir a Mi lista');
      boton.setAttribute('aria-pressed', String(dentro()));
    };
    boton.addEventListener('click', () => { alternarMiLista(info.item); pintar(); });
    pintar();
    botones.append(boton);
  }

  if (video) {
    const sonido = botonRedondo({ 'aria-label': 'Activar sonido' }, icono('silencio', 'size-4'));
    sonido.addEventListener('click', () => {
      video.muted = !video.muted;
      sonido.replaceChildren(icono(video.muted ? 'silencio' : 'sonido', 'size-4'));
      sonido.setAttribute('aria-label', video.muted ? 'Activar sonido' : 'Silenciar');
    });
    botones.append(sonido);
  }

  if (info.masInfo) {
    botones.append(el('span', { class: 'flex-1' }),
      botonRedondo({ href: info.masInfo, 'aria-label': `Más información de ${info.titulo}` }, icono('abajo', 'size-5')));
  }

  return el('div', {
    role: 'dialog', 'aria-label': info.titulo,
    class: 'vista-previa absolute z-50 overflow-hidden rounded-md bg-superficie shadow-[0_18px_50px_-8px_rgba(0,0,0,.85)] ring-1 ring-white/10',
  },
  medio,
  el('div', { class: 'space-y-2.5 p-3' },
    botones,
    el('p', { class: 'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold' },
      info.etiqueta && el('span', { class: 'rounded-sm border border-white/40 px-1 py-px text-[0.65rem] uppercase tracking-wider text-texto-suave', texto: info.etiqueta }),
      ...(info.meta || []).filter(Boolean).flatMap((m, i) => [
        i ? el('span', { class: 'text-texto-suave/60', 'aria-hidden': 'true', texto: '•' }) : null,
        el('span', { class: i ? 'text-texto/80' : 'text-rosa', texto: m }),
      ]))));
}

export function activarVistaPrevia() {
  // Solo dispositivos con ratón de verdad: en táctil la tarjeta se toca y abre directamente.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let espera = null;
  let abierta = null; // { nodo, ventana }

  const cerrar = (rapido = false) => {
    clearTimeout(espera);
    if (!abierta) return;
    const { ventana, escala } = abierta;
    abierta = null;
    if (rapido) return ventana.remove();
    ventana.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: `scale(${escala})`, opacity: 0 }],
      { duration: 160, easing: 'ease-in' }).finished.then(() => ventana.remove(), () => ventana.remove());
  };

  const abrir = (nodo) => {
    const info = registro.get(nodo);
    if (!info || !nodo.isConnected) return;
    cerrar(true);
    const r = nodo.getBoundingClientRect();
    const ancho = Math.max(r.width * 1.5, 320);
    const altoMedio = (ancho * 9) / 16;
    let izquierda = r.left + r.width / 2 - ancho / 2;
    // Pegada al borde si la tarjeta está en un extremo (como Netflix)
    if (izquierda < MARGEN) izquierda = Math.max(MARGEN, r.left);
    if (izquierda + ancho > window.innerWidth - MARGEN) izquierda = Math.min(window.innerWidth - MARGEN - ancho, r.right - ancho);
    const arriba = Math.max(r.top + r.height / 2 - altoMedio / 2 - 20, 76);

    const ventana = construir(info);
    ventana.style.width = `${ancho}px`;
    ventana.style.left = `${izquierda + window.scrollX}px`;
    ventana.style.top = `${arriba + window.scrollY}px`;
    // Crece desde el centro de la tarjeta
    ventana.style.transformOrigin = `${r.left + r.width / 2 - izquierda}px ${r.top + r.height / 2 - arriba}px`;
    const escala = r.width / ancho;
    document.body.append(ventana);
    ventana.animate([{ transform: `scale(${escala})`, opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
    abierta = { nodo, ventana, escala };

    ventana.addEventListener('pointerleave', (e) => {
      if (!nodo.contains(e.relatedTarget)) cerrar();
    });
  };

  document.addEventListener('pointerover', (e) => {
    const nodo = e.target.closest?.('[data-vista-previa]');
    if (!nodo || abierta?.nodo === nodo) return;
    clearTimeout(espera);
    espera = setTimeout(() => abrir(nodo), RETRASO_MS);
  });
  document.addEventListener('pointerout', (e) => {
    const nodo = e.target.closest?.('[data-vista-previa]');
    if (!nodo || nodo.contains(e.relatedTarget)) return;
    clearTimeout(espera);
    if (abierta?.nodo === nodo && !abierta.ventana.contains(e.relatedTarget)) cerrar();
  });

  // Se cierra al desplazar (página o carrusel), al pulsar Esc o al cambiar de vista.
  document.addEventListener('scroll', () => cerrar(true), { capture: true, passive: true });
  window.addEventListener('keydown', (e) => e.key === 'Escape' && cerrar());
  window.addEventListener('hashchange', () => cerrar(true));
  window.addEventListener('resize', () => cerrar(true));
}
