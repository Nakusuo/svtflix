/**
 * "Mi lista" sin cuentas: se guarda solo en el navegador de cada visitante (localStorage).
 * Si el navegador no deja guardar (modo privado, almacenamiento bloqueado), funciona mientras dure la visita.
 */
const CLAVE = 'svtflix:mi-lista';
const EVENTO = 'svtflix:mi-lista';
let enMemoria = null;

function leer() {
  if (enMemoria) return enMemoria;
  try {
    // Se descartan las entradas antiguas de Contenido guardadas como su página madre (tenían página y URL a la vez)
    enMemoria = (JSON.parse(localStorage.getItem(CLAVE)) || []).filter((x) => !(x.pagina && x.url_video));
  } catch {
    enMemoria = [];
  }
  return enMemoria;
}

function guardar(lista) {
  enMemoria = lista;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch { /* sin almacenamiento: queda en memoria */ }
  document.dispatchEvent(new CustomEvent(EVENTO));
}

/** Identificador estable de un elemento: su página interna o su URL. */
export const claveDe = (item) => (item.pagina ? `pagina:${item.pagina}` : item.url_video || '');

export const miLista = () => [...leer()];
export const estaEnMiLista = (item) => leer().some((x) => x.clave === claveDe(item));

/** Añade o quita. Devuelve true si quedó dentro. */
export function alternarMiLista(item) {
  const clave = claveDe(item);
  if (!clave) return false;
  const lista = leer();
  if (lista.some((x) => x.clave === clave)) {
    guardar(lista.filter((x) => x.clave !== clave));
    return false;
  }
  const { titulo, url_video, pagina, url_miniatura, plataforma } = item;
  // Con página interna no se guarda la URL: así "página y URL a la vez" solo puede ser una entrada antigua (ver leer)
  guardar([{ clave, titulo, url_video: pagina ? '' : url_video, pagina, url_miniatura, plataforma }, ...lista]);
  return true;
}

export const alCambiarMiLista = (fn) => document.addEventListener(EVENTO, fn);
