// Prepara la carpeta web/ antes de compilar o servir:
// - copia los CSV de contenido/ a web/datos/ (copia local de la hoja: se usa mientras
//   no haya URLs de Google Sheets en config.js, y como respaldo si Google falla)
// - copia PapaParse a web/js/vendor/
import { cpSync, mkdirSync, readdirSync } from 'node:fs';

mkdirSync('web/datos', { recursive: true });
for (const archivo of readdirSync('contenido')) {
  // Las pestañas (.csv) y el índice de canciones para el buscador (videos.json)
  if (archivo.endsWith('.csv') || archivo === 'videos.json') cpSync(`contenido/${archivo}`, `web/datos/${archivo}`);
}

mkdirSync('web/js/vendor', { recursive: true });
cpSync('node_modules/papaparse/papaparse.min.js', 'web/js/vendor/papaparse.min.js');

console.log('web/ preparada: datos locales y PapaParse copiados');
