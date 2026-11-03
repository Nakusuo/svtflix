// Genera el logo de SVTFLIX en SVG con el estilo del logo de Netflix:
// letras condensadas en rojo y la curva característica (letras de los extremos más altas).
//
// Fuente: Bebas Neue (SIL Open Font License, uso libre). No se usa la tipografía ni el logo de Netflix:
// solo se imita el estilo. Las letras se convierten en trazos, así que el SVG no necesita la fuente.
//
// Uso: node tools/logo.mjs   → web/img/logo-svtflix.svg y web/img/favicon.svg
import { readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';

const ROJO = '#E50914';
const archivo = readFileSync('node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff');
const fuente = opentype.parse(archivo.buffer.slice(archivo.byteOffset, archivo.byteOffset + archivo.byteLength));

/** Coloca las letras una a una (para controlar el espaciado) y devuelve todos los comandos del trazo. */
function trazar(texto, tam, espaciado) {
  const comandos = [];
  let x = 0;
  for (const glifo of fuente.stringToGlyphs(texto)) {
    comandos.push(...glifo.getPath(x, tam, tam).commands);
    x += (glifo.advanceWidth / fuente.unitsPerEm) * tam + espaciado;
  }
  return comandos;
}

function limites(comandos) {
  const xs = [], ys = [];
  for (const c of comandos) {
    for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
      if (c[kx] !== undefined) { xs.push(c[kx]); ys.push(c[ky]); }
    }
  }
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/**
 * Curva tipo Netflix: cada punto se estira hacia abajo según lo lejos que esté del centro.
 * El borde de arriba queda recto (con una leve caída en el centro) y el de abajo forma un arco.
 */
function curvar(comandos, { abajo = 0.17, arriba = 0.02 } = {}) {
  const { x0, x1, y0, y1 } = limites(comandos);
  const cx = (x0 + x1) / 2;
  const mitad = (x1 - x0) / 2;
  const alto = y1 - y0;
  const mover = (x, y) => {
    const n = ((x - cx) / mitad) ** 2; // 0 en el centro, 1 en los extremos
    const t = (y - y0) / alto; // 0 arriba, 1 abajo
    // Abajo: los extremos bajan más (arco). Arriba: los extremos suben un poco.
    return [x, y0 + (y - y0) * (1 + abajo * n) - arriba * alto * n * (1 - t)];
  };
  return comandos.map((c) => {
    const nuevo = { ...c };
    for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
      if (c[kx] !== undefined) [nuevo[kx], nuevo[ky]] = mover(c[kx], c[ky]);
    }
    return nuevo;
  });
}

function aSvgPath(comandos) {
  const f = (n) => Number(n.toFixed(1));
  return comandos.map((c) => {
    switch (c.type) {
      case 'M': case 'L': return `${c.type}${f(c.x)} ${f(c.y)}`;
      case 'Q': return `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}`;
      case 'C': return `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}`;
      case 'Z': return 'Z';
      default: return '';
    }
  }).join('');
}

function svg(comandos, { margen = 2, titulo }) {
  const { x0, x1, y0, y1 } = limites(comandos);
  const caja = [x0 - margen, y0 - margen, x1 - x0 + margen * 2, y1 - y0 + margen * 2].map((n) => Number(n.toFixed(1)));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${caja.join(' ')}" role="img" aria-label="${titulo}">
  <title>${titulo}</title>
  <path fill="${ROJO}" d="${aSvgPath(comandos)}"/>
</svg>
`;
}

// Logo principal
const logo = curvar(trazar('SVTFLIX', 200, -1));
writeFileSync('web/img/logo-svtflix.svg', svg(logo, { titulo: 'SVTFLIX' }));

// Icono de la pestaña: una S sobre negro
const s = trazar('S', 200, 0);
const { x0, x1, y0, y1 } = limites(s);
const lado = (y1 - y0) * 1.35;
const dx = (lado - (x1 - x0)) / 2 - x0;
const dy = (lado - (y1 - y0)) / 2 - y0;
const sCentrada = s.map((c) => {
  const n = { ...c };
  for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
    if (c[kx] !== undefined) { n[kx] = c[kx] + dx; n[ky] = c[ky] + dy; }
  }
  return n;
});
const r = Number((lado * 0.2).toFixed(1));
writeFileSync('web/img/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado.toFixed(1)} ${lado.toFixed(1)}">
  <rect width="${lado.toFixed(1)}" height="${lado.toFixed(1)}" rx="${r}" fill="#000"/>
  <path fill="${ROJO}" d="${aSvgPath(sCentrada)}"/>
</svg>
`);

console.log('Logo y favicon generados en web/img/');
