/**
 * Motor de datos (Fase 2): lee las 9 pestañas, las normaliza y guarda una copia.
 *
 * Origen de cada pestaña:
 *  1. La URL CSV publicada de Google Sheets (config.js), si existe.
 *  2. Si no hay URL, la copia local web/datos/<Pestaña>.csv (sale de contenido/).
 *  3. Si la petición falla, la última copia guardada en este navegador (localStorage).
 */
import { HOJAS, TIEMPO_ESPERA_MS } from './config.js';

const PESTANAS = {
  portada: 'Portada', miembros: 'Miembros', enlaces: 'Enlaces', musica: 'Musica', programas: 'Programas',
  redes: 'Redes', creditos: 'Creditos', paginas: 'Paginas', contenido: 'Contenido',
};

/** "Título Álbum " → "titulo_album". También sirve para comparar IDs y nombres (RN-01). */
export function normalizar(texto = '') {
  return String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toLowerCase()
    .replace(/[\s-]+/g, '_');
}

async function pedir(url) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_ESPERA_MS);
  try {
    const respuesta = await fetch(url, { signal: control.signal, cache: 'no-cache' });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return await respuesta.text();
  } finally {
    clearTimeout(reloj);
  }
}

function parsear(texto) {
  const { data } = window.Papa.parse(texto, { header: true, skipEmptyLines: 'greedy', transformHeader: normalizar });
  const filas = data
    .map((fila) => Object.fromEntries(Object.entries(fila).map(([k, v]) => [k, (v ?? '').trim()])))
    .filter((fila) => normalizar(fila.activo || 'si') !== 'no');
  // Orden estable: las filas sin número quedan en el orden de la hoja.
  return filas
    .map((fila, i) => ({ fila, i }))
    .sort((a, b) => (Number(a.fila.orden) || 0) - (Number(b.fila.orden) || 0) || a.i - b.i)
    .map(({ fila }) => fila);
}

function guardarCopia(clave, filas) {
  try {
    localStorage.setItem(`svtflix:${clave}`, JSON.stringify({ fecha: Date.now(), filas }));
  } catch { /* sin almacenamiento disponible: no pasa nada */ }
}

function leerCopia(clave) {
  try {
    return JSON.parse(localStorage.getItem(`svtflix:${clave}`))?.filas ?? null;
  } catch {
    return null;
  }
}

async function cargarPestana(clave, nombre) {
  const url = HOJAS[clave] || `datos/${nombre}.csv`;
  try {
    const filas = parsear(await pedir(url));
    guardarCopia(clave, filas);
    return filas;
  } catch (error) {
    const copia = leerCopia(clave);
    console.warn(`[SVTFLIX] No se pudo leer "${nombre}" (${error.message}).`, copia ? 'Uso la última copia guardada.' : 'Sin copia guardada.');
    return copia;
  }
}

/** Devuelve { portada: [...], miembros: [...], ... }. Una pestaña que no se pudo leer vale null. */
export async function cargarTodo() {
  const claves = Object.keys(PESTANAS);
  const resultados = await Promise.all(claves.map((c) => cargarPestana(c, PESTANAS[c])));
  const datos = Object.fromEntries(claves.map((c, i) => [c, resultados[i]]));
  // En Contenido, la columna "Pagina" es la página madre, no un enlace a una página interna (como en Enlaces).
  // Se renombra a "madre" para que una tarjeta de Contenido no se confunda con un enlace a su propia página.
  datos.contenido = datos.contenido?.map(({ pagina, ...x }) => ({ ...x, madre: pagina })) ?? null;
  console.info('[SVTFLIX] Datos cargados:', Object.fromEntries(claves.map((c) => [c, datos[c]?.length ?? 'error'])));
  return datos;
}
