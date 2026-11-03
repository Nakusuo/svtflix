"""Recorre el sitio de Canva (páginas y diseños incrustados) hasta no encontrar nada nuevo
y guarda el HTML de cada uno en la carpeta indicada.

Uso: python3 tools/canva/descargar.py /tmp/canva-html
"""
import re, sys, time, urllib.request, pathlib
OUT = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36'}
SITE = 'https://svtflixesp.my.canva.site/'


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read().decode('utf-8', 'replace')


vistos, cola, mapa = {('pagina', '')}, [('pagina', '', None)], []


def descubrir(h, origen):
    for s in re.findall(r'svtflixesp\.my\.canva\.site\\?/([a-z0-9-]+)', h):
        s = s.removesuffix('https')
        if s and not s.startswith('_') and ('pagina', s) not in vistos:
            vistos.add(('pagina', s))
            cola.append(('pagina', s, origen))
    for did, tok in re.findall(r'canva\.com\\?/design\\?/([A-Za-z0-9_-]+)\\?/([A-Za-z0-9_-]+)\\?/view', h):
        if ('diseno', did) not in vistos:
            vistos.add(('diseno', did))
            cola.append(('diseno', (did, tok), origen))


while cola:
    tipo, clave, origen = cola.pop(0)
    try:
        if tipo == 'pagina':
            h = get(SITE + clave)
            nombre = f'site_{clave or "inicio"}.html'
        else:
            did, tok = clave
            h = get(f'https://www.canva.com/design/{did}/{tok}/view?embed')
            nombre = f'design_{did}.html'
        (OUT / nombre).write_text(h, encoding='utf-8')
        mapa.append(f'{nombre}\t{origen}')
        descubrir(h, nombre)
    except Exception as e:
        print('ERROR', tipo, clave, e)
    time.sleep(0.3)

(OUT / 'mapa.tsv').write_text('\n'.join(mapa), encoding='utf-8')
print('páginas:', sum(1 for t, _ in vistos if t == 'pagina'), 'diseños:', sum(1 for t, _ in vistos if t == 'diseno'))
