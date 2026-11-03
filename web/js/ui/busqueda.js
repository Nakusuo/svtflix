/**
 * Buscador: el campo de la cabecera y la vista de resultados (#/buscar/<texto>).
 */
import { buscar, prepararVideos } from '../buscar.js';
import { el, urlSegura } from '../seguro.js';
import { tarjeta } from './comunes.js';

const RUTA = '#/buscar/';

// ---------- Vista de resultados ----------

function tarjetaMiembro({ item: m }) {
  return el('a', {
    href: `#/miembro/${encodeURIComponent(m.id)}`,
    class: 'group/b flex w-24 shrink-0 flex-col items-center gap-2 text-center sm:w-28',
  },
  el('img', {
    src: urlSegura(m.url_foto), alt: '', loading: 'lazy', width: 600, height: 889,
    class: 'size-20 rounded-full object-cover object-top ring-2 ring-white/10 transition group-hover/b:ring-rosa sm:size-24',
  }),
  el('span', { class: 'font-display text-sm', texto: m.nombre }),
  el('span', { class: '-mt-2 text-[0.65rem] uppercase tracking-wider text-texto-suave', texto: m.subunidad }));
}

const seccion = (titulo, ...hijos) => el('section', { class: 'px-4 py-3 sm:px-10 sm:py-4' },
  el('h2', { class: 'mb-3 font-display text-base uppercase tracking-wide sm:text-xl', texto: titulo }), ...hijos);

const rejilla = (items) => el('div', { class: 'grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] sm:gap-3' },
  items.map((i) => tarjeta(i, { ancho: 'w-full' })));

export function vistaBusqueda(consulta) {
  prepararVideos();
  const r = buscar(consulta);
  const cabecera = el('header', { class: 'px-4 pb-2 pt-24 sm:px-10 sm:pt-28' },
    el('p', { class: 'text-sm text-texto-suave', texto: r.total === 1 ? '1 resultado para' : `${r.total} resultados para` }),
    el('h1', { class: 'font-display text-2xl uppercase sm:text-4xl', texto: `«${consulta}»` }));

  if (!r.total) {
    return el('article', { class: 'min-h-[60svh]' }, cabecera,
      el('div', { class: 'px-4 py-6 text-texto/85 sm:px-10' },
        el('p', { class: 'mb-2', texto: 'No encontramos nada con ese nombre.' }),
        el('ul', { class: 'mb-5 list-disc space-y-1 pl-5 text-sm text-texto-suave' },
          el('li', { texto: 'Prueba con otra palabra o solo una parte del título.' }),
          el('li', { texto: 'Busca por integrante, programa o año (por ejemplo: «Hoshi», «GOSE», «2019»).' })),
        el('a', { href: '#sugerencias', class: 'inline-flex min-h-11 items-center rounded-md bg-white/15 px-4 text-sm font-bold ring-1 ring-white/20 transition hover:bg-white/25', texto: '¿Quieres que lo agreguemos? Pídelo aquí' })));
  }

  return el('article', { class: 'min-h-[60svh] pb-6' }, cabecera,
    r.miembros.length > 0 && seccion('Integrantes',
      el('div', { class: 'flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]' }, r.miembros.map(tarjetaMiembro))),
    r.paginas.length > 0 && seccion('Colecciones', rejilla(r.paginas.map(({ item: p }) => ({
      titulo: p.titulo, pagina: p.pagina, url_miniatura: p.url_portada, categoria: 'Colección',
    })))),
    r.contenido.length > 0 && seccion('Videos y listas', rejilla(r.contenido.map(({ item, contexto }) => ({ ...item, seccion: contexto, categoria: contexto })))));
}

// ---------- Campo de búsqueda en la cabecera ----------

export function activarBuscador(enrutar) {
  const cabecera = document.getElementById('cabecera');
  const boton = document.getElementById('abrir-buscador');
  const campo = document.getElementById('campo-busqueda');
  if (!boton || !campo) return;

  const abrir = () => {
    prepararVideos(); // empieza a bajar el índice de canciones mientras escribes
    cabecera.toggleAttribute('data-buscando', true);
    boton.setAttribute('aria-expanded', 'true');
    campo.focus();
  };
  const cerrar = () => {
    cabecera.toggleAttribute('data-buscando', false);
    boton.setAttribute('aria-expanded', 'false');
  };

  boton.addEventListener('click', () => (cabecera.hasAttribute('data-buscando') && !campo.value ? cerrar() : abrir()));

  campo.addEventListener('input', () => {
    const q = campo.value.trim();
    if (!q) {
      if (location.hash.startsWith(RUTA)) location.hash = '';
      return;
    }
    const destino = RUTA + encodeURIComponent(q);
    if (location.hash.startsWith(RUTA)) {
      history.replaceState(null, '', destino); // al escribir no se llena el historial
      enrutar();
    } else {
      location.hash = destino; // el primer carácter sí crea entrada, para que "atrás" vuelva a donde estabas
    }
  });

  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      campo.value = '';
      if (location.hash.startsWith(RUTA)) location.hash = '';
      cerrar();
      campo.blur();
    }
  });
  campo.addEventListener('blur', () => { if (!campo.value.trim()) cerrar(); });
  campo.closest('form')?.addEventListener('submit', (e) => { e.preventDefault(); campo.blur(); });

  // Atajo de teclado "/" para buscar (como en muchas webs)
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement?.tagName)) {
      e.preventDefault();
      abrir();
    }
  });

  // Si se entra con un enlace de búsqueda, el campo aparece ya relleno
  const sincronizar = () => {
    if (location.hash.startsWith(RUTA)) {
      const q = decodeURIComponent(location.hash.slice(RUTA.length));
      if (campo.value.trim() !== q) campo.value = q;
      abrir();
    } else if (document.activeElement !== campo) {
      campo.value = '';
      cerrar();
    }
  };
  window.addEventListener('hashchange', sincronizar);
  sincronizar();
}
