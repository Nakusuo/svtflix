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
    enMemoria = JSON.parse(localStorage.getItem(CLAVE)) || [];
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
  guardar([{ clave, titulo, url_video, pagina, url_miniatura, plataforma }, ...lista]);
  return true;
}

export const alCambiarMiLista = (fn) => document.addEventListener(EVENTO, fn);
