/**
 * Vistas de detalle (versión provisional como páginas; en la Fase 4 la ficha pasa a ser un modal):
 *   #/miembro/<id>  ficha de integrante con su música y programas (RF-15, RF-16)
 *   #/pagina/<id>   página interna tipo Conciertos o Variety, agrupada por sección
 */
import { normalizar } from '../datos.js';
import { el, urlSegura } from '../seguro.js';
import { agrupar, fila, mensajeVacio, tarjeta } from './comunes.js';

const volver = () => el('a', {
  href: '#', class: 'mb-6 inline-flex items-center gap-2 text-sm font-semibold text-texto-suave transition hover:text-rosa',
}, el('span', { 'aria-hidden': 'true', texto: '←' }), 'Volver al inicio');

/** Cabecera grande con imagen o video de fondo. */
function cabecera({ imagen, video, contenido }) {
  const fondo = el('div', { class: 'absolute inset-0 -z-10' },
    imagen && el('img', { src: imagen, alt: '', class: 'h-full w-full object-cover' }));
  if (video && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const v = el('video', { src: video, poster: imagen || null, muted: true, autoplay: true, loop: true, playsinline: true, 'aria-hidden': 'true', class: 'absolute inset-0 h-full w-full object-cover' });
    v.muted = true;
    fondo.append(v);
  }
  return el('header', { class: 'relative isolate flex min-h-[60vh] items-end overflow-hidden px-4 pb-10 pt-28 sm:px-10' },
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
      contenido: el('div', { class: 'flex flex-col gap-8 sm:flex-row sm:items-end' },
        el('img', { src: urlSegura(m.url_foto), alt: `Foto de ${m.nombre}`, width: 600, height: 889, class: 'w-36 shrink-0 rounded-md shadow-2xl shadow-black/70 ring-1 ring-white/15 sm:w-48' }),
        el('div', { class: 'max-w-2xl' },
          el('p', { class: 'mb-1 text-xs font-bold uppercase tracking-[0.3em] text-rosa', texto: [m.rol, m.subunidad].filter(Boolean).join(' · ') }),
          el('h1', { class: 'mb-3 font-display text-5xl uppercase sm:text-7xl' }, m.nombre, m.emoji && el('span', { class: 'ml-3 align-middle text-3xl sm:text-4xl', texto: m.emoji })),
          m.biografia && el('p', { class: 'mb-4 leading-relaxed text-texto/90', texto: m.biografia }),
          ig && el('a', { href: ig, target: '_blank', rel: 'noopener', class: 'inline-flex items-center gap-2 rounded-md bg-white/15 px-4 py-2 text-sm font-bold ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25' }, 'Instagram', el('span', { 'aria-hidden': 'true', texto: '↗' })))),
    }),
    filasDatos.length && el('dl', { class: 'grid grid-cols-2 gap-x-8 px-4 pb-4 sm:grid-cols-3 sm:px-10 lg:grid-cols-6' }, filasDatos.map((par) => el('div', {}, par))),
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
        el('h1', { class: 'mb-3 font-display text-4xl uppercase sm:text-6xl', texto: p.titulo }),
        p.descripcion && el('p', { class: 'leading-relaxed text-texto/90', texto: p.descripcion }),
        el('p', { class: 'mt-3 text-sm text-texto-suave', texto: `${items.length} elementos` })),
    }),
    items.length
      ? secciones.map(([seccion, lista]) => el('section', { class: 'px-4 py-4 sm:px-10', 'aria-label': seccion || p.titulo },
        seccion && el('h2', { class: 'mb-3 font-display text-lg uppercase tracking-wide sm:text-xl', texto: seccion }),
        el('div', { class: 'grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3' },
          lista.map((i) => tarjeta(i, { ancho: 'w-full' })))))
      : mensajeVacio('Aún no hay contenido en esta página.'));
}
