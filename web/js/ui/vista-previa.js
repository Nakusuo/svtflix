/**
 * Vista previa como en Netflix.
 *  - Con ratón: tras una pausa sobre una tarjeta aparece una ventana 1,5 veces más ancha que crece desde ella.
 *  - En táctil: al tocar una tarjeta se abre una ficha desde abajo (como la app de Netflix).
 * Las dos llevan imagen o video (clip propio o YouTube silenciado), botones (reproducir, Mi lista,
 * sonido, más información) y una línea de datos. Cada tarjeta se registra con registrarVistaPrevia(nodo, info).
 */
import { alternarMiLista, estaEnMiLista } from '../mi-lista.js';
import { el } from '../seguro.js';
import { icono } from './iconos.js';

const RETRASO_MS = 450;
const RETRASO_VIDEO_MS = 700; // como Netflix: primero la imagen, luego arranca la vista previa
const MARGEN = 12; // distancia mínima a los bordes de la ventana
const INICIO_SEG = 10; // las vistas previas de YouTube empiezan un poco después para saltar intros

// Primeros videos de cada lista (datos/listas.json, lo genera tools/indice_videos.py).
// Pedirle a YouTube un video concreto es más fiable que "la lista" entera.
let listas = null;
const cargarListas = () => (listas ??= fetch('datos/listas.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})));
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
  class: `grid ${props.tam || 'size-9'} shrink-0 place-items-center rounded-full ring-2 transition active:scale-90 ${props.class || 'ring-white/40 text-texto hover:ring-white'}`,
  tam: null,
}, ...hijos);

/** tactil = ficha del móvil: botones de 44px y un "Reproducir" ancho, como la app de Netflix. */
function construir(info, { tactil = false } = {}) {
  const tam = tactil ? 'size-11' : 'size-9';
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
  // Vista previa de YouTube (silenciada). Se muestra solo cuando YouTube confirma que está reproduciendo;
  // si el video no permite incrustarse, se queda la miniatura.
  let youtube = null;
  if (!video && info.youtube && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    youtube = previaYouTube(info.youtube);
    medio.append(youtube.marco);
  }

  medio.append(
    el('div', { class: 'pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent' }),
    el('p', { class: 'absolute bottom-2 left-3 right-12 line-clamp-2 font-display text-lg uppercase leading-tight drop-shadow-lg', texto: info.titulo }));

  const botones = el('div', { class: 'flex items-center gap-2' },
    tactil
      ? el('a', enlace({ class: 'mr-1 inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-texto px-4 font-bold text-fondo active:scale-95' }),
        icono('play', 'size-5'), info.externo ? 'Reproducir' : 'Abrir')
      : botonRedondo(enlace({ class: 'bg-texto text-fondo ring-texto hover:bg-white', 'aria-label': `Ver ${info.titulo}` }), icono('play', 'size-4 translate-x-px')));

  if (info.item) {
    const dentro = () => estaEnMiLista(info.item);
    const boton = botonRedondo({ tam, 'aria-pressed': String(dentro()) });
    const pintar = () => {
      boton.replaceChildren(icono(dentro() ? 'hecho' : 'mas', 'size-4'));
      boton.setAttribute('aria-label', dentro() ? 'Quitar de Mi lista' : 'Añadir a Mi lista');
      boton.setAttribute('aria-pressed', String(dentro()));
    };
    boton.addEventListener('click', () => { alternarMiLista(info.item); pintar(); });
    pintar();
    botones.append(boton);
  }

  if (video || youtube) {
    let silenciado = true;
    const sonido = botonRedondo({ tam, 'aria-label': 'Activar sonido' }, icono('silencio', 'size-4'));
    sonido.addEventListener('click', () => {
      silenciado = !silenciado;
      if (video) video.muted = silenciado;
      else youtube.silenciar(silenciado);
      sonido.replaceChildren(icono(silenciado ? 'silencio' : 'sonido', 'size-4'));
      sonido.setAttribute('aria-label', silenciado ? 'Activar sonido' : 'Silenciar');
    });
    botones.append(sonido);
  }

  if (info.masInfo) {
    if (!tactil) botones.append(el('span', { class: 'flex-1' }));
    botones.append(botonRedondo({ tam, href: info.masInfo, 'aria-label': `Más información de ${info.titulo}` }, icono('abajo', 'size-5')));
  }

  const ventana = el('div', {
    role: 'dialog', 'aria-label': info.titulo,
    class: tactil
      ? 'vista-previa-hoja fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg overflow-hidden rounded-t-2xl bg-superficie pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_60px_rgba(0,0,0,.8)] ring-1 ring-white/10'
      : 'vista-previa absolute z-50 overflow-hidden rounded-md bg-superficie shadow-[0_18px_50px_-8px_rgba(0,0,0,.85)] ring-1 ring-white/10',
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

  if (youtube) setTimeout(() => ventana.isConnected && youtube.cargar(), tactil ? 250 : RETRASO_VIDEO_MS);
  return ventana;
}

/**
 * Iframe de YouTube sin controles, silenciado y en bucle. Se comunica con postMessage (enablejsapi=1)
 * sin cargar la librería de YouTube: así sabemos cuándo empieza a reproducirse y podemos quitar el silencio.
 */
function previaYouTube({ tipo, id }) {
  const marco = el('iframe', {
    title: 'Vista previa', tabindex: '-1', allow: 'autoplay; encrypted-media', referrerpolicy: 'strict-origin-when-cross-origin',
    // Sin eventos de ratón (si no, al entrar en el iframe la ventana creería que el ratón se fue) y algo ampliado
    // para recortar los rótulos que YouTube pone arriba.
    class: 'pointer-events-none absolute inset-0 h-full w-full scale-[1.32] opacity-0 transition-opacity duration-700',
  });
  const avisar = (func, args = []) => marco.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');

  const alMensaje = (e) => {
    if (e.source !== marco.contentWindow) return;
    let d;
    try { d = JSON.parse(e.data); } catch { return; }
    const estado = d.event === 'onStateChange' ? d.info : d.info?.playerState;
    if (estado === 1) marco.classList.remove('opacity-0'); // 1 = reproduciendo
  };

  return {
    marco,
    async cargar() {
      const p = new URLSearchParams({
        autoplay: '1', mute: '1', controls: '0', playsinline: '1', rel: '0', iv_load_policy: '3',
        disablekb: '1', fs: '0', enablejsapi: '1', origin: location.origin,
      });
      let video = tipo === 'video' ? id : '';
      if (tipo === 'lista') {
        // Un video de la lista (el primero) en vez de "videoseries": arranca antes y falla menos
        video = (await cargarListas())[id]?.[0] || '';
        // Solo ese video, sin "list" ni "loop/playlist": con esos parámetros YouTube pinta
        // los botones de lista (anterior/siguiente) encima de la vista previa.
        if (video) p.set('start', String(INICIO_SEG));
        else p.set('list', id); // sin índice: la lista entera como último recurso
      }
      if (!marco.isConnected) return; // la ventana se cerró mientras tanto
      window.addEventListener('message', alMensaje);
      marco.addEventListener('load', () => {
        marco.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
      }, { once: true });
      marco.src = `https://www.youtube-nocookie.com/embed/${video || 'videoseries'}?${p}`;
      // Al cerrarse la ventana, el iframe desaparece y dejamos de escuchar
      new MutationObserver((_, obs) => {
        if (!marco.isConnected) { window.removeEventListener('message', alMensaje); obs.disconnect(); }
      }).observe(document.body, { childList: true });
    },
    silenciar(si) { avisar(si ? 'mute' : 'unMute'); },
  };
}

export function activarVistaPrevia() {
  // Con ratón: ventana flotante. En táctil (sin hover): ficha desde abajo al tocar.
  // ?tactil en la URL fuerza el modo táctil (para probar el móvil desde un ordenador)
  const forzarTactil = new URLSearchParams(location.search).has('tactil');
  if (forzarTactil || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    activarHojaTactil();
    return;
  }
  cargarListas();

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

/** Móvil y tablet: tocar una tarjeta abre su vista previa en una ficha desde abajo. */
function activarHojaTactil() {
  let abierta = null; // { hoja, fondo }

  const quitar = () => {
    if (!abierta) return;
    const { hoja, fondo } = abierta;
    abierta = null;
    document.documentElement.classList.remove('overflow-hidden');
    fondo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).finished.finally(() => fondo.remove());
    hoja.animate([{ transform: getComputedStyle(hoja).transform === 'none' ? 'translateY(0)' : getComputedStyle(hoja).transform }, { transform: 'translateY(100%)' }],
      { duration: 220, easing: 'ease-in' }).finished.finally(() => hoja.remove());
  };
  // Cerrar = volver atrás en el historial (así el botón "atrás" del móvil también la cierra)
  const cerrar = () => (abierta && history.state?.svtflixHoja ? history.back() : quitar());

  const abrir = (info) => {
    cargarListas();
    if (abierta) quitar();
    const fondo = el('div', { class: 'fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px]', onclick: cerrar });
    const hoja = construir(info, { tactil: true });
    hoja.prepend(
      el('div', { class: 'absolute inset-x-0 top-0 z-10 flex justify-center pt-2', 'aria-hidden': 'true' },
        el('span', { class: 'h-1 w-10 rounded-full bg-white/50 shadow' })),
      el('button', {
        type: 'button', 'aria-label': 'Cerrar', onclick: cerrar,
        class: 'absolute right-2 top-2 z-10 grid size-11 place-items-center rounded-full bg-black/60 text-texto backdrop-blur active:scale-90',
      }, icono('mas', 'size-5 rotate-45')));
    document.body.append(fondo, hoja);
    document.documentElement.classList.add('overflow-hidden');
    fondo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    hoja.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
    history.pushState({ svtflixHoja: true }, '');
    abierta = { hoja, fondo };

    // Deslizar hacia abajo para cerrar
    let inicioY = null;
    hoja.addEventListener('pointerdown', (e) => { inicioY = e.clientY; });
    hoja.addEventListener('pointermove', (e) => {
      if (inicioY === null) return;
      const dy = Math.max(0, e.clientY - inicioY);
      if (dy > 6) hoja.style.transform = `translateY(${dy}px)`;
    });
    const soltar = (e) => {
      if (inicioY === null) return;
      const dy = e.clientY - inicioY;
      inicioY = null;
      if (dy > 90) cerrar();
      else hoja.style.transform = '';
    };
    hoja.addEventListener('pointerup', soltar);
    hoja.addEventListener('pointercancel', soltar);
  };

  // En fase de captura, para adelantarnos al enlace de la tarjeta
  document.addEventListener('click', (e) => {
    const nodo = e.target.closest?.('[data-vista-previa]');
    const info = nodo && registro.get(nodo);
    if (!info) return;
    e.preventDefault();
    abrir(info);
  }, true);

  window.addEventListener('popstate', () => quitar());
  window.addEventListener('hashchange', () => quitar());
  window.addEventListener('keydown', (e) => e.key === 'Escape' && cerrar());
}
