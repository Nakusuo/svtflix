/**
 * Utilidades de YouTube: reconoce enlaces de video o lista y calcula su miniatura (RF-24, RF-25).
 */

/** { tipo: 'video' | 'lista', id } o null si no es un enlace de YouTube que entendamos. */
export function infoYouTube(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)youtube\.com$|^youtu\.be$/.test(u.hostname)) return null;

  let id = u.searchParams.get('v');
  if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
  const ruta = u.pathname.match(/^\/(shorts|live|embed)\/([\w-]{11})/);
  if (ruta) id = ruta[2];

  if (id && /^[\w-]{11}$/.test(id)) return { tipo: 'video', id };
  const lista = u.searchParams.get('list');
  if (lista) return { tipo: 'lista', id: lista };
  return null;
}

/** Miniatura oficial de un video. Las listas no tienen una URL fija, así que devuelven ''. */
export function miniaturaYouTube(info) {
  return info?.tipo === 'video' ? `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg` : '';
}
