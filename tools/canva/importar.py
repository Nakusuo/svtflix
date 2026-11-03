"""
Convierte el sitio de Canva de SVTFLIX en los CSV de la hoja de Google Sheets y descarga sus imágenes.

Uso (desde la raíz del repo):
    python3 tools/canva/descargar.py /ruta/html          # 1. guarda el HTML de todas las páginas
    python3 tools/canva/importar.py /ruta/html           # 2. genera contenido/*.csv y la lista de imágenes
    python3 tools/canva/importar.py /ruta/html --imagenes  # 3. además descarga y convierte las imágenes a WebP

Canva guarda cada diseño como un JSON interno con claves cortas ("A", "B", "G"...).
Lo que usamos de ese formato:
    elemento.A / .B          posición x / y
    elemento.D / .C          ancho / alto
    elemento.G  o texto.Q    enlace
    {"A?": "K"}              elemento de texto
    {"A?": "d", "A": id}     referencia a una imagen (id de media)
    "files": [...]           cada imagen en varios tamaños (URLs firmadas que caducan)
"""
import concurrent.futures as cf
import csv
import json
import pathlib
import re
import subprocess
import sys
import unicodedata
import urllib.parse
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parents[2]
DIR_HTML = pathlib.Path(sys.argv[1])
CON_IMAGENES = '--imagenes' in sys.argv
SALIDA_CSV = RAIZ / 'contenido'
WEB = RAIZ / 'web'
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36'}
SITIO = 'svtflixesp.my.canva.site/'

# Orden del Top 13 y subunidad oficial (respaldo si la página no la indica)
MIEMBROS = [
    ('s-coups', 'S.COUPS', 'Hip-Hop Team'), ('jeonghan', 'JEONGHAN', 'Vocal Team'),
    ('joshua', 'JOSHUA', 'Vocal Team'), ('jun', 'JUN', 'Performance Team'),
    ('hoshi', 'HOSHI', 'Performance Team'), ('wonwoo', 'WONWOO', 'Hip-Hop Team'),
    ('woozi', 'WOOZI', 'Vocal Team'), ('dk', 'DK', 'Vocal Team'),
    ('mingyu', 'MINGYU', 'Hip-Hop Team'), ('the8', 'THE8', 'Performance Team'),
    ('seungkwan', 'SEUNGKWAN', 'Vocal Team'), ('vernon', 'VERNON', 'Hip-Hop Team'),
    ('dino', 'DINO', 'Performance Team'),
]
SLUGS_MIEMBROS = {m[0] for m in MIEMBROS}

# Diseños de la portada de Canva → fila del catálogo
FILAS_INICIO = {
    'MÚSICA': ('Música', 1), 'PRE-DEBUT': ('Predebut', 2), 'CONTENIDO VARIADO': ('Contenido Diverso', 3),
    'GOING SEVENTEEN': ('Going Seventeen', 4), 'PROYECCIONES': ('Proyecciones', 5),
}


# ---------- lectura del formato de Canva ----------

def leer_bootstrap(h):
    m = re.search(r"window\['bootstrap'\] = JSON\.parse\('(.*?)'\);", h, re.S)
    s = m.group(1).encode('utf-8').decode('unicode_escape').encode('latin-1').decode('utf-8')
    return json.loads(s)


def recorrer(o):
    if isinstance(o, dict):
        yield o
        for v in o.values():
            yield from recorrer(v)
    elif isinstance(o, list):
        for v in o:
            yield from recorrer(v)


def texto_de(el):
    a = el.get('a') or {}
    if isinstance(a.get('C'), dict) and isinstance(a['C'].get('A'), list):
        partes = [p for p in a['C']['A'] if isinstance(p, str)]
    elif isinstance(a.get('A'), list):
        partes = [p.get('A', '') for p in a['A'] if isinstance(p, dict) and isinstance(p.get('A'), str)]
    else:
        partes = []
    return ' '.join(''.join(partes).split())


def textos(el):
    return [t for d in recorrer(el) if d.get('A?') == 'K' for t in [texto_de(d)] if t]


def enlaces(el):
    out = []
    for d in recorrer(el):
        for k in ('G', 'Q'):
            v = d.get(k)
            if isinstance(v, str) and v.startswith('http') and v not in out:
                out.append(v)
    return out


ID_MEDIA = re.compile(r'^MA[A-Za-z0-9_-]{9}$')


def medias(el):
    """Ids de imagen usados por el elemento. A veces llevan la marca {"A?": "d"} y a veces no,
    así que se reconocen por la forma del id (MA + 9 caracteres)."""
    out = []
    for d in recorrer(el):
        v = d.get('A')
        if isinstance(v, str) and ID_MEDIA.match(v) and v not in out:
            out.append(v)
    return out


def archivos_de_imagen(h, base):
    """id de media → lista de archivos [{url, width, height}] en todos los tamaños.
    Los diseños incrustados usan URLs firmadas de media.canva.com (caducan en ~1 día);
    las páginas del sitio usan archivos fijos en <página>/_assets/media/ (relativos a `base`)."""
    res = {}
    for m in re.finditer(r'\{"type":"RASTER","id":"([A-Za-z0-9_-]+)"', h):
        j = h.find('"files":[', m.start())
        if j == -1 or j - m.start() > 3000:
            continue
        trozo = h[j:h.find(']', j) + 1]
        for u, w, hh in re.findall(r'"url":"([^"]+)"[^{}]*?"width":(\d+),"height":(\d+)', trozo):
            u = u.replace('\\/', '/').replace('\\u0026', '&')
            if not u.startswith('http'):
                u = base + u.lstrip('/')
            lista = res.setdefault(m.group(1), [])
            if all(f['url'] != u for f in lista):
                lista.append({'url': u, 'width': int(w), 'height': int(hh)})
    return res


def sin_duplicados(filas):
    """Canva a veces parte una tarjeta en dos piezas con el mismo enlace: se quedan las que tienen título."""
    por_url = {}
    for f in filas:
        por_url.setdefault((f.get('Miembro') or f.get('Pagina'), f['URL_Video']), []).append(f)
    salida = []
    for f in filas:
        grupo = por_url[(f.get('Miembro') or f.get('Pagina'), f['URL_Video'])]
        con_titulo = [g for g in grupo if g['Titulo']]
        if not f['Titulo'] and (con_titulo or grupo[0] is not f):
            if con_titulo and not con_titulo[0]['URL_Miniatura']:
                con_titulo[0]['URL_Miniatura'] = f['URL_Miniatura']
            continue
        salida.append(f)
    return salida


def leer_pagina(f):
    h = f.read_text(encoding='utf-8')
    b = leer_bootstrap(h)
    doc = b['page']
    paginas = doc.get('C', {}).get('D', {}).get('A', {}).get('A') or doc.get('A', {}).get('A') or []
    titulo = re.search(r'<title>(.*?)</title>', h, re.S)
    items = []
    for n, pg in enumerate(paginas):
        for el in pg.get('E', []):
            base = {'pag': n, 'x': el.get('A', 0), 'y': el.get('B', 0), 'w': el.get('D', 0), 'h': el.get('C', 0)}
            ls, ts, ms = enlaces(el), textos(el), medias(el)
            if ls:
                items.append({**base, 'tipo': 'tarjeta', 'enlaces': ls, 'textos': ts, 'medias': ms})
            elif ts:
                items.append({**base, 'tipo': 'texto', 'textos': ts})
            elif ms:
                items.append({**base, 'tipo': 'imagen', 'medias': ms})
    pagina = f.stem.removeprefix('site_')
    base = 'https://' + SITIO + ('' if pagina == 'inicio' else pagina + '/')
    archivos = archivos_de_imagen(h, base)
    videos = videos_de(h, base)
    for vid, v in videos.items():  # el fotograma de cada video se trata como una imagen más
        if v['poster']:
            archivos['P' + vid] = [{'url': v['poster'], 'width': v['width'], 'height': v['height']}]
    return {'titulo': (titulo.group(1).strip() if titulo else ''), 'items': items, 'videos': videos}, archivos


def videos_de(h, base):
    """id de video → {mp4 más grande, fotograma, tamaño}. Las fichas de integrante y la portada usan clips cortos."""
    res = {}
    for m in re.finditer(r'"id":"(V[A-Za-z0-9_-]{10})","files":\[(.*?)\]', h):
        fs = [(u, int(w), int(hh)) for u, w, hh in re.findall(r'"url":"([^"]+)","width":(\d+),"height":(\d+)', m.group(2))]
        if not fs:
            continue
        u, w, hh = max(fs, key=lambda x: x[1] * x[2])
        poster = re.search(r'"posterframes":\[\{"A":"([^"]+)"', h[m.end():m.end() + 1500])
        abs_ = lambda p: p if p.startswith('http') else base + p.lstrip('/')
        res[m.group(1)] = {'mp4': abs_(u), 'width': w, 'height': hh, 'poster': abs_(poster.group(1)) if poster else ''}
    return res


# ---------- utilidades ----------

def slug(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')[:60] or 'sin-titulo'


def limpiar_url(u):
    """Quita parámetros de rastreo (si=, utm_, igsh=) y deja solo lo necesario."""
    p = urllib.parse.urlsplit(u)
    q = [(k, v) for k, v in urllib.parse.parse_qsl(p.query) if k not in ('si', 'igsh', 'feature', 'pp') and not k.startswith('utm_')]
    host = p.netloc.replace('m.youtube.com', 'www.youtube.com')
    if host == 'youtube.com':
        host = 'www.youtube.com'
    return urllib.parse.urlunsplit((p.scheme, host, p.path, urllib.parse.urlencode(q), ''))


def plataforma(u):
    host = urllib.parse.urlsplit(u).netloc.lower()
    for clave, nombre in [('youtu', 'YouTube'), ('docs.google', 'Google Docs'), ('drive.google', 'Google Drive'),
                          ('bilibili', 'Bilibili'), ('ok.ru', 'OK.ru'), ('dailymotion', 'Dailymotion'), ('dai.ly', 'Dailymotion'), ('weverse', 'Weverse'), ('vlive', 'V LIVE')]:
        if clave in host:
            return nombre
    return 'Otro'


def pagina_interna(u):
    if SITIO in u:
        return u.split(SITIO, 1)[1].strip('/').split('?')[0]
    return ''


def ordenar(items):
    return sorted(items, key=lambda i: (i['pag'], round(i['y'] / 40), i['x']))


def seccion_de(tarjeta, cabeceras):
    """Cabecera que manda sobre la tarjeta: la más a la derecha que quede a su izquierda (misma página),
    o la última de páginas anteriores."""
    misma = [c for c in cabeceras if c['pag'] == tarjeta['pag'] and c['x'] <= tarjeta['x'] + 30 and c['y'] <= tarjeta['y'] + 60]
    if misma:
        return max(misma, key=lambda c: (c['x'], c['y']))['texto']
    previas = [c for c in cabeceras if c['pag'] < tarjeta['pag']]
    if previas:
        return max(previas, key=lambda c: (c['pag'], c['x'], c['y']))['texto']
    return ''


# ---------- imágenes ----------

IMAGENES = {}  # ruta destino → (media id, ancho objetivo)
ARCHIVOS = {}  # media id → archivos


def area(mid):
    fs = ARCHIVOS.get(mid) or []
    return max((f['width'] * f['height'] for f in fs), default=0)


def proporcion(mid):
    fs = ARCHIVOS.get(mid) or []
    f = max(fs, key=lambda f: f['width'] * f['height'], default=None)
    return (f['width'] / f['height']) if f else 0


def mejor_media(ids, prop=None):
    ids = [i for i in ids if i in ARCHIVOS]
    if prop:
        cerca = [i for i in ids if abs(proporcion(i) - prop) < 0.12]
        ids = cerca or ids
    return max(ids, key=area, default='')


def imagen(mid, carpeta, nombre, ancho):
    """Registra una imagen a descargar y devuelve su ruta pública (relativa a web/)."""
    if not mid:
        return ''
    ruta = f'img/{carpeta}/{nombre}.webp'
    usada = IMAGENES.get(ruta)
    if usada and usada[0] != mid:
        ruta = f'img/{carpeta}/{nombre}-{mid[-5:].lower()}.webp'
    IMAGENES[ruta] = (mid, ancho)
    return ruta


VIDEOS = {}  # ruta destino → URL del mp4


def logo_transparente(ruta):
    """El logo del álbum viene gris sobre blanco; en Canva se ve blanco sobre el video.
    Lo pasamos a blanco con fondo transparente (solo si aún no tiene transparencia)."""
    archivo = WEB / ruta
    if not archivo.exists():
        return
    canales = subprocess.run(['identify', '-format', '%[channels]', str(archivo)], capture_output=True, text=True).stdout
    if 'a' in canales:
        return
    mascara = archivo.with_suffix('.mascara.png')
    subprocess.run(['magick', str(archivo), '-alpha', 'off', '-colorspace', 'gray', '-negate', '-level', '8%,70%', str(mascara)], check=True)
    subprocess.run(['magick', str(mascara), '-fill', 'white', '-colorize', '100', str(mascara), '-alpha', 'off',
                    '-compose', 'CopyOpacity', '-composite', '-quality', '90', f'webp:{archivo}'], check=True)
    mascara.unlink()


def video(v, carpeta, nombre):
    if not v:
        return ''
    ruta = f'video/{carpeta}/{nombre}.mp4'
    VIDEOS[ruta] = v['mp4']
    return ruta


def descargar_video(ruta, url):
    destino = WEB / ruta
    if destino.exists():
        return 'ya estaba'
    destino.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        destino.write_bytes(r.read())
    return 'ok'


def descargar(ruta, mid, ancho):
    destino = WEB / ruta
    if destino.exists():
        return 'ya estaba'
    fs = sorted(ARCHIVOS[mid], key=lambda f: f['width'])
    f = next((f for f in fs if f['width'] >= ancho), fs[-1])
    destino.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(f['url'], headers=UA), timeout=60) as r:
        datos = r.read()
    tmp = destino.with_suffix('.tmp')
    tmp.write_bytes(datos)
    subprocess.run(['magick', str(tmp), '-resize', f'{ancho}x>', '-strip', '-quality', '80', f'webp:{destino}'], check=True)
    tmp.unlink()
    return 'ok'


# ---------- construcción de las pestañas ----------

def escribir(nombre, columnas, filas):
    SALIDA_CSV.mkdir(exist_ok=True)
    with open(SALIDA_CSV / f'{nombre}.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=columnas, quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        for f in filas:
            w.writerow({k: f.get(k, '') for k in columnas})
    print(f'  {nombre}.csv: {len(filas)} filas')


def parsear_datos(t):
    # En Canva a veces falta el ":" tras la etiqueta, por eso es opcional.
    etiquetas = {
        'Nombre_Real': r'Nombre (?:real|Real|completo|Completo)', 'Nombre_Coreano': r'Nombre Corea(?:no)?',
        'Fecha_Nacimiento': r'Fecha de nacimiento', 'Lugar_Nacimiento': r'Lugar de nacimiento',
        'Estatura': r'Estatura', 'Signo': r'Signo Zodiacal', 'Emoji': r'Emoji',
    }
    pos = []
    for campo, patron in etiquetas.items():
        m = re.search(patron + r'\s*:?\s*', t)
        if m:
            pos.append((m.start(), m.end(), campo))
    pos.sort()
    datos = {}
    for i, (_, fin, campo) in enumerate(pos):
        siguiente = pos[i + 1][0] if i + 1 < len(pos) else len(t)
        datos[campo] = t[fin:siguiente].strip(' /')
    if 'Fecha_Nacimiento' in datos:  # "16-Enero-1998 (26 Años)": la edad caduca, se quita
        datos['Fecha_Nacimiento'] = re.sub(r'\s*\(.*?\)', '', datos['Fecha_Nacimiento'])
    m = re.fullmatch(r'(\d)\.(\d\d) cm', datos.get('Estatura', ''))
    if m:  # "1.66 cm" → "166 cm"
        datos['Estatura'] = f'{m.group(1)}{m.group(2)} cm'
    return datos


def main():
    paginas = {}
    for f in sorted(DIR_HTML.glob('*.html')):
        try:
            datos, archivos = leer_pagina(f)
        except Exception as e:
            print('  aviso: no se pudo leer', f.name, e)
            continue
        ARCHIVOS.update(archivos)
        paginas[f.stem] = datos
    disenos = {d['titulo']: d for k, d in paginas.items() if k.startswith('design_')}
    sitio = {k.removeprefix('site_'): d for k, d in paginas.items() if k.startswith('site_')}
    avisos = []

    # --- Portada ---
    ini = sitio['inicio']['items']
    tarj = [i for i in ini if i['tipo'] == 'tarjeta']
    rep = next(i for i in tarj if 'Reproducir' in i['textos'])
    nuevo = next((i for i in tarj if 'Nuevo Álbum' in i['textos']), None)
    imgs_hero = sorted([i for i in ini if i['tipo'] == 'imagen' and i['pag'] == 0], key=lambda i: -(i['w'] * i['h']))
    logo = next((i for i in imgs_hero if 150 < i['w'] < 260 and abs(i['w'] - i['h']) < 10), None)
    clip = next(iter(sitio['inicio']['videos'].items()), None)  # (id, datos) del video de fondo
    portada = [{
        'Titulo_Album': 'DREAMSCAPE', 'Subtitulo': 'JEONGHAN X JOSHUA 1st Mini Album',
        'URL_Logo': imagen(mejor_media(logo['medias']) if logo else '', 'portada', 'logo-album', 600),
        'URL_Video_Teaser': limpiar_url(rep['enlaces'][1] if len(rep['enlaces']) > 1 else rep['enlaces'][0]),
        'URL_Video_Fondo': video(clip[1], 'portada', 'fondo') if clip else '',
        'URL_Poster': imagen('P' + clip[0] if clip else mejor_media(imgs_hero[0]['medias']), 'portada', 'poster', 1920),
        'URL_Boton_Principal': limpiar_url(rep['enlaces'][0]),
        'Texto_Boton_Secundario': 'Nuevo Álbum' if nuevo else '',
        'URL_Boton_Secundario': limpiar_url(nuevo['enlaces'][0]) if nuevo else '',
        'Activo': 'Sí',
    }]
    escribir('Portada', ['Titulo_Album', 'Subtitulo', 'URL_Logo', 'URL_Video_Teaser', 'URL_Video_Fondo', 'URL_Poster', 'URL_Boton_Principal',
                         'Texto_Boton_Secundario', 'URL_Boton_Secundario', 'Activo'], portada)

    # --- Miembros, Musica, Programas ---
    tarjetas_top = {pagina_interna(t['enlaces'][0]): t for t in disenos['MIEMBROS']['items'] if t['tipo'] == 'tarjeta'}
    miembros, musica, programas = [], [], []
    for n, (mid, nombre, unidad) in enumerate(MIEMBROS, 1):
        pg = sitio.get(mid)
        if not pg:
            avisos.append(f'Falta la página del integrante {mid}')
            continue
        its = pg['items']
        txts = [i for i in its if i['tipo'] == 'texto']
        largos = sorted([' '.join(i['textos']) for i in txts if len(' '.join(i['textos'])) > 80], key=len)
        datos_txt = next((t for t in largos if 'Nombre' in t and ':' in t), '')
        bio = next((t for t in largos if t != datos_txt), '')
        datos = parsear_datos(datos_txt)
        ig = next((limpiar_url(e) for t in its if t['tipo'] == 'tarjeta' for e in t['enlaces'] if 'instagram.com' in e), '')
        clip = next(iter(pg['videos'].items()), None)  # clip corto de la ficha
        top = tarjetas_top.get(mid)
        miembros.append({
            'ID': mid, 'Numero': n, 'Nombre': nombre, 'Subunidad': unidad, 'Rol': 'Líder' if mid == 's-coups' else '',
            'URL_Foto': imagen(mejor_media(top['medias'], prop=2 / 3) if top else '', 'miembros', mid, 600),
            'Foto_Fondo': imagen('P' + clip[0] if clip else '', 'miembros', f'{mid}-fondo', 1600),
            'Video_Fondo': video(clip[1], 'miembros', mid) if clip else '',
            'Biografia': bio, **datos, 'Instagram': ig,
        })
        cabeceras = [{'pag': i['pag'], 'x': i['x'], 'y': i['y'], 'texto': i['textos'][0]}
                     for i in txts if i['textos'][0] in ('Música', 'Programas')]
        orden = {'Música': 0, 'Programas': 0}
        for t in ordenar([i for i in its if i['tipo'] == 'tarjeta']):
            url = t['enlaces'][0]
            if 'instagram.com' in url:
                continue
            sec = seccion_de(t, cabeceras) or 'Programas'
            titulo = ' '.join(t['textos']) or ('Canciones' if sec == 'Música' else '')
            if not titulo:
                avisos.append(f'{mid}: tarjeta sin título → {limpiar_url(url)}')
            orden[sec] += 1
            fila = {'Miembro': mid, 'Titulo': titulo, 'URL_Video': limpiar_url(url), 'Plataforma': plataforma(url),
                    'URL_Miniatura': imagen(mejor_media(t['medias']), f'miembros/{mid}', slug(titulo or 'sin-titulo'), 480),
                    'Orden': orden[sec]}
            (musica if sec == 'Música' else programas).append(fila)
    escribir('Miembros', ['ID', 'Numero', 'Nombre', 'Subunidad', 'Rol', 'URL_Foto', 'Foto_Fondo', 'Video_Fondo', 'Biografia', 'Nombre_Real',
                          'Nombre_Coreano', 'Fecha_Nacimiento', 'Lugar_Nacimiento', 'Estatura', 'Signo', 'Emoji', 'Instagram'], miembros)
    cols_mp = ['Miembro', 'Titulo', 'URL_Video', 'Plataforma', 'URL_Miniatura', 'Orden']
    escribir('Musica', cols_mp, sin_duplicados(musica))
    escribir('Programas', cols_mp, sin_duplicados(programas))

    # --- Enlaces (filas del inicio) ---
    enlaces_inicio = []
    for titulo_diseno, (categoria, orden_cat) in FILAS_INICIO.items():
        d = disenos.get(titulo_diseno)
        if not d:
            avisos.append(f'No encontré el diseño {titulo_diseno}')
            continue
        for n, t in enumerate(ordenar([i for i in d['items'] if i['tipo'] == 'tarjeta']), 1):
            url = t['enlaces'][0]
            interna = pagina_interna(url)
            titulo = ' '.join(t['textos'])
            enlaces_inicio.append({
                'Categoria': categoria, 'Orden_Categoria': orden_cat, 'Titulo': titulo,
                'URL_Video': '' if interna else limpiar_url(url), 'Pagina': interna,
                'URL_Miniatura': imagen(mejor_media(t['medias']), 'catalogo', slug(titulo), 640),
                'Orden': n, 'Activo': 'Sí',
            })
    escribir('Enlaces', ['Categoria', 'Orden_Categoria', 'Titulo', 'URL_Video', 'Pagina', 'URL_Miniatura', 'Orden', 'Activo'], enlaces_inicio)

    # --- Paginas y Contenido (subpáginas de categoría) ---
    paginas_cat, contenido = [], []
    for pid, pg in sitio.items():
        if pid == 'inicio' or pid in SLUGS_MIEMBROS:
            continue
        its = pg['items']
        txts = [i for i in its if i['tipo'] == 'texto']
        titulo_pag = re.sub(r'&#39;', "'", pg['titulo'])
        desc = max((' '.join(i['textos']) for i in txts), key=len, default='')
        titulo_visible = next((i['textos'][0] for i in txts if i['textos'][0].isupper() and len(i['textos'][0]) > 4
                               and not re.match(r'^\d{4}', i['textos'][0])), titulo_pag)
        # Portada: la imagen grande (no vectorial) de la página; si no hay, la miniatura de su tarjeta en el inicio.
        grandes = [i for i in its if i['tipo'] == 'imagen' and mejor_media(i['medias']) and i['w'] > 600]
        fondo = max(grandes, key=lambda i: i['w'] * i['h'], default=None)
        tarjeta_inicio = next((e for e in enlaces_inicio if e['Pagina'] == pid), {})
        # El título bonito es el de la tarjeta del inicio que lleva a esta página.
        titulo_tarjeta = tarjeta_inicio.get('Titulo', titulo_pag)
        portada_pag = (imagen(mejor_media(fondo['medias']), f'paginas/{pid}', 'portada', 1600) if fondo
                       else tarjeta_inicio.get('URL_Miniatura', ''))
        paginas_cat.append({'Pagina': pid, 'Titulo': titulo_tarjeta, 'Descripcion': desc, 'URL_Portada': portada_pag})
        ignorar = {'Ver', titulo_visible, desc}
        cabeceras = [{'pag': i['pag'], 'x': i['x'], 'y': i['y'], 'texto': ' '.join(i['textos'])}
                     for i in txts if ' '.join(i['textos']) not in ignorar and len(' '.join(i['textos'])) <= 40]
        for n, t in enumerate(ordenar([i for i in its if i['tipo'] == 'tarjeta']), 1):
            url = t['enlaces'][0]
            if pagina_interna(url) == '' and SITIO in url:
                continue
            titulo = ' '.join(t['textos'])
            if not titulo:
                avisos.append(f'{pid}: tarjeta sin título → {limpiar_url(url)}')
            contenido.append({
                'Pagina': pid, 'Seccion': seccion_de(t, cabeceras), 'Titulo': titulo,
                'URL_Video': limpiar_url(url), 'Plataforma': plataforma(url),
                'URL_Miniatura': imagen(mejor_media(t['medias']), f'paginas/{pid}', slug(titulo or 'sin-titulo'), 480),
                'Orden': n, 'Activo': 'Sí',
            })
    escribir('Paginas', ['Pagina', 'Titulo', 'Descripcion', 'URL_Portada'], paginas_cat)
    escribir('Contenido', ['Pagina', 'Seccion', 'Titulo', 'URL_Video', 'Plataforma', 'URL_Miniatura', 'Orden', 'Activo'],
             sin_duplicados(contenido))

    # --- Redes ---
    redes = [{'Seccion': 'Cabecera', 'Nombre': 'CARAT', 'URL': 'https://weverse.io/seventeen/feed', 'Icono': 'weverse', 'Orden': 1}]
    for titulo_diseno, seccion in [('REDES SEVENTEEN', 'Sigue'), ('PLATAFORMAS SEVENTEEN', 'Escucha')]:
        for n, t in enumerate(ordenar([i for i in disenos[titulo_diseno]['items'] if i['tipo'] == 'tarjeta']), 1):
            nombre = ' '.join(t['textos'])
            redes.append({'Seccion': seccion, 'Nombre': nombre, 'URL': limpiar_url(t['enlaces'][0]),
                          'Icono': slug(nombre.replace('(Twitter)', '')).replace('pagina-oficial', 'web'), 'Orden': n})
    escribir('Redes', ['Seccion', 'Nombre', 'URL', 'Icono', 'Orden'], redes)

    # --- Creditos ---
    cred_txt = next(' '.join(i['textos']) for i in ini if i['tipo'] == 'texto' and '✦' in ' '.join(i['textos']))
    nombres = [n.strip() for n in cred_txt.split('✦') if n.strip()]
    vistos, creditos = set(), []
    for n, nombre in enumerate(nombres, 1):
        if nombre.lower() in vistos:
            continue
        vistos.add(nombre.lower())
        tipo = 'Creadora' if 'creadora' in nombre.lower() else 'Subtítulos'
        creditos.append({'Nombre': nombre.replace(' creadora del SVTFLIX', ''), 'URL': '', 'Tipo': tipo, 'Orden': len(creditos) + 1})
    creditos.append({'Nombre': 'Angeline (@luuuvang)', 'URL': '', 'Tipo': 'Diseño', 'Orden': len(creditos) + 1})
    escribir('Creditos', ['Nombre', 'URL', 'Tipo', 'Orden'], creditos)

    # --- informe ---
    (SALIDA_CSV / 'imagenes.json').write_text(json.dumps({r: m for r, (m, _) in sorted(IMAGENES.items())}, indent=1), encoding='utf-8')
    print(f'  imágenes a descargar: {len(IMAGENES)} · videos: {len(VIDEOS)}')
    if avisos:
        print('  avisos:')
        for a in avisos:
            print('   -', a)

    if CON_IMAGENES:
        ok = err = 0
        with cf.ThreadPoolExecutor(6) as ex:
            futuros = {ex.submit(descargar, r, m, a): r for r, (m, a) in IMAGENES.items()}
            for fu in cf.as_completed(futuros):
                try:
                    fu.result()
                    ok += 1
                except Exception as e:
                    err += 1
                    print('   error imagen', futuros[fu], e)
        print(f'  imágenes: {ok} bien, {err} con error')
        for ruta, url in VIDEOS.items():
            try:
                descargar_video(ruta, url)
            except Exception as e:
                print('   error video', ruta, e)
        print(f'  videos: {len(VIDEOS)}')
        logo_transparente('img/portada/logo-album.webp')


if __name__ == '__main__':
    main()
