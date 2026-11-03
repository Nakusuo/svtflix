/**
 * Vistas de detalle (versión provisional como páginas; en la Fase 4 la ficha pasa a ser un modal):
 *   #/miembro/<id>  ficha de integrante con su música y programas (RF-15, RF-16)
 *   #/pagina/<id>   página interna tipo Conciertos o Variety, agrupada por sección
 */
import { normalizar } from '../datos.js';
import { el, urlSegura } from '../seguro.js';
import { agrupar, fila, mensajeVacio, tarjeta } from './comunes.js';
import { icono } from './iconos.js';

const volver = () => el('a', {
  href: '#',
  class: 'mb-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-black/40 pl-3 pr-4 text-sm font-semibold text-texto ring-1 ring-white/15 backdrop-blur transition active:scale-95 hover:text-rosa hover:ring-rosa/50 sm:mb-6',
}, icono('volver'), 'Volver al inicio');

/** Cabecera grande con imagen o video de fondo. */
function cabecera({ imagen, video, contenido }) {
  const fondo = el('div', { class: 'absolute inset-0 -z-10' },
    imagen && el('img', { src: imagen, alt: '', class: 'h-full w-full object-cover' }));
  if (video && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const v = el('video', { src: video, poster: imagen || null, muted: true, autoplay: true, loop: true, playsinline: true, 'aria-hidden': 'true', class: 'absolute inset-0 h-full w-full object-cover' });
    v.muted = true;
    fondo.append(v);
  }
  return el('header', { class: 'relative isolate flex min-h-[55svh] items-end overflow-hidden px-4 pb-6 pt-24 sm:min-h-[60vh] sm:px-10 sm:pb-10 sm:pt-28' },
    fondo,
    el('div', { class: 'absolute inset-0 -z-10 bg-gradient-to-t from-fondo via-fondo/60 to-fondo/10', 'aria-hidden': 'true' }),
    el('div', { class: 'absolute inset-0 -z-10 bg-gradient-to-r from-fondo/80 to-transparent', 'aria-hidden': 'true' }),
    el('div', { class: 'relative w-full max-w-5xl animate-[aparecer_.6s_ease-out_both]' }, volver(), contenido));
}

// ---------- Integrante ----------

const DATOS = [
  ['nombre_real', 'Nombre real'], ['nombre_coreano', 'Nombre coreano'], ['fecha_nacimiento', 'Nacimiento'],
  ['lugar_nacimiento', 'Lugar'], ['estatura', 'Estatura'], ['signo', 'Signo'],
];

export function vistaMiembro(datos, id) {
  const m = (datos.miembros || []).find((x) => normalizar(x.id) === normalizar(id));
  if (!m) return el('div', { class: 'px-4 pt-28 sm:px-10' }, volver(), mensajeVacio('No encontramos a ese integrante.'));

  const suyo = (lista) => (lista || []).filter((x) => normalizar(x.miembro) === normalizar(m.id));
  const ig = urlSegura(m.instagram);
  const filasDatos = DATOS.filter(([k]) => m[k]).map(([k, etiqueta]) => [
    el('dt', { class: 'text-xs font-bold uppercase tracking-widest text-texto-suave', texto: etiqueta }),
    el('dd', { class: 'mb-3 text-sm', texto: m[k] }),
  ]);

  return el('article', {},
    cabecera({
      imagen: urlSegura(m.foto_fondo),
      video: urlSegura(m.video_fondo),
      contenido: el('div', { class: 'grid grid-cols-[6.5rem_minmax(0,1fr)] items-end gap-x-4 gap-y-4 sm:flex sm:gap-8' },
        el('img', { src: urlSegura(m.url_foto), alt: `Foto de ${m.nombre}`, width: 600, height: 889, class: 'w-full shrink-0 rounded-md shadow-2xl shadow-black/70 ring-1 ring-white/15 sm:w-48' }),
        el('div', { class: 'contents max-w-2xl sm:block' },
          el('div', { class: 'min-w-0 self-end' },
            el('p', { class: 'mb-1 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-rosa sm:text-xs', texto: [m.rol, m.subunidad].filter(Boolean).join(' · ') }),
            // El tamaño se adapta al ancho para que nombres largos (SEUNGKWAN) quepan en una línea
            el('h1', { class: 'font-display text-[clamp(1.2rem,6.6vw,2.6rem)] uppercase leading-none [overflow-wrap:anywhere] sm:mb-3 sm:text-7xl' }, m.nombre),
            m.emoji && el('p', { class: 'mt-1 text-2xl sm:text-3xl', texto: m.emoji })),
          el('div', { class: 'col-span-2' },
            m.biografia && el('p', { class: 'mb-4 text-[0.95rem] leading-relaxed text-texto/90 sm:text-base', texto: m.biografia }),
            ig && el('a', { href: ig, target: '_blank', rel: 'noopener', class: 'inline-flex min-h-11 items-center gap-2 rounded-md bg-white/15 px-4 text-sm font-bold ring-1 ring-white/20 backdrop-blur transition active:scale-95 hover:bg-white/25' }, 'Instagram', icono('externo', 'size-3.5'))))),
    }),
    filasDatos.length > 0 && el('dl', { class: 'mx-4 mb-4 grid grid-cols-2 gap-x-6 rounded-lg bg-superficie/70 px-4 pt-4 ring-1 ring-white/5 sm:mx-10 sm:grid-cols-3 sm:bg-transparent sm:px-0 sm:ring-0 lg:grid-cols-6' }, filasDatos.map((par) => el('div', { class: 'min-w-0 break-words' }, par))),
    fila('Música', suyo(datos.musica)) || mensajeVacio('Aún no hay música de este integrante.'),
    fila('Programas', suyo(datos.programas)) || mensajeVacio('Aún no hay programas de este integrante.'));
}

// ---------- Página interna ----------

export function vistaPagina(datos, id) {
  const p = (datos.paginas || []).find((x) => normalizar(x.pagina) === normalizar(id));
  if (!p) return el('div', { class: 'px-4 pt-28 sm:px-10' }, volver(), mensajeVacio('No encontramos esa página.'));

  const items = (datos.contenido || []).filter((x) => normalizar(x.pagina) === normalizar(p.pagina));
  const secciones = [...agrupar(items, 'seccion')];

  return el('article', {},
    cabecera({
      imagen: urlSegura(p.url_portada),
      contenido: el('div', { class: 'max-w-2xl' },
        el('h1', { class: 'mb-2 font-display text-[2.2rem] uppercase leading-none sm:mb-3 sm:text-6xl', texto: p.titulo }),
        p.descripcion && el('p', { class: 'text-[0.95rem] leading-relaxed text-texto/90 sm:text-base', texto: p.descripcion }),
        el('p', { class: 'mt-3 text-sm text-texto-suave', texto: `${items.length} elementos` })),
    }),
    items.length
      ? secciones.map(([seccion, lista]) => el('section', { class: 'px-4 py-3 sm:px-10 sm:py-4', 'aria-label': seccion || p.titulo },
        seccion && el('h2', { class: 'mb-2 font-display text-base uppercase tracking-wide sm:mb-3 sm:text-xl', texto: seccion }),
        el('div', { class: 'grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] sm:gap-3' },
          lista.map((i) => tarjeta(i, { ancho: 'w-full' })))))
      : mensajeVacio('Aún no hay contenido en esta página.'));
}
