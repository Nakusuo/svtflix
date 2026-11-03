/**
 * Crear elementos de forma segura (RNF-10): los datos de la hoja nunca pasan por innerHTML.
 */

/** Acepta rutas del propio sitio (img/, video/, datos/) o URLs https. Cualquier otra cosa → ''. */
export function urlSegura(url) {
  if (!url) return '';
  const limpia = String(url).trim();
  if (/^(img|video|datos)\/[\w./-]+$/.test(limpia)) return limpia;
  try {
    const u = new URL(limpia);
    return u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

/**
 * el('a', { class: '…', href: '…', texto: 'Hola', onclick: fn }, hijo1, [hijo2, hijo3])
 * Los textos se insertan siempre como texto, nunca como HTML.
 */
export function el(etiqueta, props = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(props)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === 'class') nodo.className = valor;
    else if (clave === 'texto') nodo.textContent = valor;
    else if (clave.startsWith('on')) nodo.addEventListener(clave.slice(2), valor);
    else nodo.setAttribute(clave, valor === true ? '' : valor);
  }
  for (const hijo of hijos.flat(Infinity)) {
    // Se ignoran null, undefined, false, '' y 0 (así `lista.length && …` nunca pinta un "0" suelto)
    if (hijo !== null && hijo !== undefined && hijo !== false && hijo !== '' && hijo !== 0) nodo.append(hijo);
  }
  return nodo;
}
