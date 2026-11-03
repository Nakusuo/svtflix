/**
 * Página de inicio: portada, Top 13, redes, filas del catálogo y créditos.
 */
import { el, urlSegura } from '../seguro.js';
import { agrupar, fila, mensajeVacio, titular } from './comunes.js';

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

  const fondo = el('div', { class: 'absolute inset-0 -z-10' },
    poster && el('img', { src: poster, alt: '', class: 'absolute inset-0 h-full w-full object-cover', fetchpriority: 'high' }));

  // El video entra después del póster y solo si el usuario no pidió reducir movimiento (RF-09).
  if (video && !reducirMovimiento()) {
    const v = el('video', {
      src: video, poster: poster || null, muted: true, autoplay: true, loop: true, playsinline: true, preload: 'auto',
      'aria-hidden': 'true', class: 'absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000',
    });
    v.muted = true; // necesario para que el navegador permita el autoplay
    v.addEventListener('playing', () => v.classList.remove('opacity-0'), { once: true });
    fondo.append(v);
  }

  contenedor.replaceChildren(
    fondo,
    el('div', { class: 'absolute inset-0 -z-10 bg-gradient-to-r from-fondo/90 via-fondo/30 to-transparent', 'aria-hidden': 'true' }),
    el('div', { class: 'absolute inset-0 -z-10 bg-gradient-to-t from-fondo via-transparent to-fondo/40', 'aria-hidden': 'true' }),
    el('div', { class: 'relative max-w-md animate-[aparecer_.8s_ease-out_both]' },
      el('p', { class: 'mb-3 text-xs font-bold uppercase tracking-[0.35em] text-rosa', texto: 'Nuevo lanzamiento' }),
      logo
        ? el('img', { src: logo, alt: p.titulo_album, class: 'mb-3 w-44 drop-shadow-[0_4px_24px_rgba(0,0,0,.6)] sm:w-56' })
        : el('h1', { class: 'mb-2 font-display text-5xl uppercase sm:text-6xl', texto: p.titulo_album }),
      logo && el('h1', { class: 'sr-only', texto: p.titulo_album }),
      p.subtitulo && el('p', { class: 'mb-6 text-sm font-semibold uppercase tracking-widest text-texto/80', texto: p.subtitulo }),
      el('div', { class: 'flex flex-wrap gap-3' },
        principal && el('a', {
          href: principal, target: '_blank', rel: 'noopener',
          class: 'inline-flex items-center gap-2 rounded-md bg-texto px-6 py-3 font-bold text-fondo shadow-xl shadow-black/40 transition hover:bg-white hover:shadow-rosa/20 active:scale-95',
        }, el('span', { 'aria-hidden': 'true', texto: '▶' }), 'Reproducir'),
        secundario && p.texto_boton_secundario && el('a', {
          href: secundario, target: '_blank', rel: 'noopener',
          class: 'inline-flex items-center gap-2 rounded-md bg-white/15 px-6 py-3 font-bold text-texto ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25 active:scale-95',
          texto: p.texto_boton_secundario,
        }))),
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
  return item;
}

export function pintarTop13(contenedor, miembros) {
  if (!miembros?.length) {
    contenedor.replaceChildren(titular('Conoce a los 13 miembros', 'titulo-miembros'), mensajeVacio('No se pudieron cargar los integrantes.'));
    return;
  }
  const ordenados = [...miembros].sort((a, b) => Number(a.numero) - Number(b.numero));
  const seccion = fila('Conoce a los 13 miembros', ordenados, tarjetaTop, 'titulo-miembros');
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
        class: 'inline-flex items-center gap-2 rounded-full bg-superficie px-4 py-2 text-sm font-semibold ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-superficie-alta hover:ring-rosa/50',
      }, r.nombre, el('span', { class: 'text-texto-suave', 'aria-hidden': 'true', texto: '↗' })))));
  });
}

// ---------- Catálogo (RF-21) ----------

export function pintarCatalogo(contenedor, enlaces) {
  if (!enlaces?.length) {
    contenedor.replaceChildren(mensajeVacio('No se pudo cargar el catálogo.'));
    return;
  }
  const ordenados = [...enlaces].sort((a, b) => (Number(a.orden_categoria) || 99) - (Number(b.orden_categoria) || 99));
  const filas = [...agrupar(ordenados, 'categoria')].map(([categoria, items]) => fila(categoria, items));
  contenedor.replaceChildren(...filas.filter(Boolean));
}

// ---------- Créditos (RF-29) ----------

export function pintarCreditos(contenedor, creditos) {
  if (!creditos?.length) return;
  const partes = creditos.flatMap((c, i) => {
    const url = urlSegura(c.url);
    const nombre = url ? el('a', { href: url, target: '_blank', rel: 'noopener', class: 'underline hover:text-rosa', texto: c.nombre }) : c.nombre;
    return i ? [el('span', { class: 'mx-1.5 text-rosa/70', 'aria-hidden': 'true', texto: '✦' }), nombre] : [nombre];
  });
  contenedor.replaceChildren(...partes);
}
