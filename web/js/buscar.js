/**
 * Buscador (RF-26): índice en memoria con todo el contenido de la hoja, sin servidor.
 *
 * Cada entrada tiene un texto principal (título) y un contexto (sección, integrante, colección…).
 * Se ignoran tildes, mayúsculas y signos. Todas las palabras buscadas tienen que aparecer.
 *
 * Preparado para un índice extra de videos sueltos (datos/videos.json: los videos que hay dentro de
 * cada lista de YouTube). Si ese archivo no existe, se busca solo en la hoja.
 */
const plano = (t = '') => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

let indice = null;

export function crearIndice(datos) {
  const miembros = new Map((datos.miembros || []).map((m) => [plano(m.id), m]));
  const paginas = new Map((datos.paginas || []).map((p) => [plano(p.pagina), p]));
  const nombreDe = (id) => miembros.get(plano(id))?.nombre || id;
  const entradas = [];
  const agregar = (tipo, item, titulo, contexto) => entradas.push({
    tipo, item, titulo, contexto, t: plano(titulo), c: plano(contexto),
  });

  for (const m of datos.miembros || []) {
    agregar('miembro', m, m.nombre, [m.nombre_real, m.nombre_coreano, m.subunidad, m.rol].filter(Boolean).join(' · '));
  }
  for (const p of datos.paginas || []) agregar('pagina', p, p.titulo, p.descripcion || '');
  for (const e of datos.enlaces || []) if (!e.pagina) agregar('contenido', e, e.titulo, e.categoria || '');
  for (const c of datos.contenido || []) {
    agregar('contenido', c, c.titulo, [paginas.get(plano(c.pagina))?.titulo, c.seccion].filter(Boolean).join(' · '));
  }
  for (const x of datos.musica || []) agregar('contenido', x, x.titulo, `Música · ${nombreDe(x.miembro)}`);
  for (const x of datos.programas || []) agregar('contenido', x, x.titulo, `Programas · ${nombreDe(x.miembro)}`);

  indice = entradas;
  return entradas.length;
}

let cargaVideos = null;
/** Descarga el índice de videos sueltos solo la primera vez que alguien usa el buscador (pesa ~1-3 MB). */
export const prepararVideos = () => (cargaVideos ??= cargarVideosSueltos());

async function cargarVideosSueltos() {
  try {
    const r = await fetch('datos/videos.json', { cache: 'no-cache' });
    if (!r.ok) return;
    const { videos = [] } = await r.json(); // [{ id, titulo, lista, alias? }]
    for (const v of videos) {
      // alias: nombre en inglés de los MV con título solo en coreano ("음악의 신" → "God of Music")
      const titulo = v.alias ? `${v.alias} — ${v.titulo}` : v.titulo;
      indice.push({
        tipo: 'contenido',
        item: { titulo, url_video: `https://www.youtube.com/watch?v=${v.id}`, categoria: v.lista },
        titulo, contexto: v.lista || '', t: plano(titulo), c: plano(v.lista),
      });
    }
    document.dispatchEvent(new CustomEvent('svtflix:indice-videos'));
  } catch { /* sin índice de videos: se busca solo en la hoja */ }
}

/** Devuelve { miembros: [...], paginas: [...], contenido: [...] } ordenados por relevancia. */
export function buscar(consulta, limite = 150) {
  const q = plano(consulta);
  const vacio = { miembros: [], paginas: [], contenido: [], total: 0 };
  if (!indice || q.length < 2) return vacio;
  const palabras = q.split(' ');

  const puntuadas = [];
  for (const e of indice) {
    const todo = `${e.t} ${e.c}`;
    if (!palabras.every((p) => todo.includes(p))) continue;
    let puntos = 0;
    if (e.t === q) puntos += 100;
    else if (e.t.startsWith(q)) puntos += 60;
    else if (e.t.includes(q)) puntos += 40;
    puntos += palabras.filter((p) => e.t.includes(p)).length * 10;
    // Lo que más se busca de una canción es su MV: primero el oficial, luego coreografía y dance practice.
    if (/\bofficial m ?v\b/.test(e.t)) puntos += 40;
    else if (/\bm ?v\b/.test(e.t)) puntos += 25;
    else if (/choreograph|dance practice|안무/.test(e.t)) puntos += 15;
    if (/reaction|reacting|리액션|behind|비하인드|vlog|making|메이킹/.test(e.t)) puntos -= 25; // reacciones, making-of y vlogs después

    if (e.tipo === 'miembro') puntos += 15;
    if (e.tipo === 'pagina') puntos += 8;
    puntuadas.push({ ...e, puntos });
  }
  puntuadas.sort((a, b) => b.puntos - a.puntos || a.titulo.localeCompare(b.titulo));

  const res = { ...vacio, total: puntuadas.length };
  for (const e of puntuadas.slice(0, limite)) {
    (e.tipo === 'miembro' ? res.miembros : e.tipo === 'pagina' ? res.paginas : res.contenido).push(e);
  }
  return res;
}
