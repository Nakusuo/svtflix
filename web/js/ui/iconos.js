/**
 * Iconos SVG en línea (trazo de 2px, estilo Lucide). Sustituyen a los símbolos de texto (▶ ↗ ←),
 * que cambian de aspecto según el móvil y su fuente.
 */
const TRAZOS = {
  play: ['M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z'],
  externo: ['M7 17 17 7', 'M8 7h9v9'],
  izquierda: ['m15 18-6-6 6-6'],
  derecha: ['m9 18 6-6-6-6'],
  volver: ['M19 12H5', 'm12 19-7-7 7-7'],
};

const NS = 'http://www.w3.org/2000/svg';

/** icono('play', 'size-5') → <svg> decorativo (aria-hidden): el texto del botón ya lo describe. */
export function icono(nombre, clases = 'size-4') {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `shrink-0 ${clases}`);
  const relleno = nombre === 'play';
  svg.setAttribute('fill', relleno ? 'currentColor' : 'none');
  svg.setAttribute('stroke', relleno ? 'none' : 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of TRAZOS[nombre] || []) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
