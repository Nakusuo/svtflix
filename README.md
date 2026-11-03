# SVTFLIX en Español

Sitio fan (no oficial) que recopila contenido de SEVENTEEN subtitulado al español, con estética de plataforma de streaming. Es estático, gratis y sin cuentas. El contenido se edita desde Google Sheets.

> Estado: **Fase 1 (entorno)**: hay una página base. El contenido llega en las fases 0 y 2.

## Arrancar en local
Necesitas Node.js y Python 3.
```bash
npm install   # solo la primera vez
npm run dev   # abre http://localhost:5500
```

## Despliegue
Vercel compila con `npm run build` y publica la carpeta `web/` (ver `vercel.json`).

## Ramas
`feature/*` → `develop` → `release/x.y.z` → `main` (con tag). Commits en español.

## Documentación
1. [Plan del proyecto](docs/01-PLAN.md): alcance, arquitectura, fases, riesgos y decisiones
2. [Requerimientos](docs/02-REQUERIMIENTOS.md): RF, RNF, reglas de negocio y modelo de datos de la hoja
3. [Historias de usuario](docs/03-HISTORIAS-DE-USUARIO.md): 30 HU con criterios de aceptación
4. [Casos de uso](docs/04-CASOS-DE-USO.md): diagrama y 12 CU detallados
5. [Especificación original](docs/00-especificacion-original.md): documento de partida
6. [Contenido extraído de Canva](contenido/LEEME.md): los CSV para la hoja de Google Sheets y cómo se actualiza la web

Sitio actual (Canva): https://svtflixesp.my.canva.site/
