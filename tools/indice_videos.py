"""
Índice de videos sueltos para el buscador: lee qué videos hay DENTRO de cada lista de YouTube del contenido
y guarda sus títulos en contenido/videos.json (la web lo copia a datos/videos.json al compilar).

Así se puede buscar una canción concreta ("God of Music") aunque en la hoja solo esté la lista "Videos Musicales".

Requisitos: yt-dlp (paru -S yt-dlp, o en un entorno virtual: python3 -m venv .venv && .venv/bin/pip install yt-dlp)
Uso (desde la raíz del repo):
    python3 tools/indice_videos.py              # todas las listas (~10 min)
    python3 tools/indice_videos.py --max 5      # solo 5 listas, para probar

No necesita claves ni cuentas. Solo hay que volver a ejecutarlo para incluir videos nuevos.
"""
import concurrent.futures as cf
import csv
import datetime
import json
import pathlib
import sys
import urllib.parse

import yt_dlp

RAIZ = pathlib.Path(__file__).resolve().parents[1]
CONTENIDO = RAIZ / 'contenido'
SALIDA = CONTENIDO / 'videos.json'
SALIDA_LISTAS = CONTENIDO / 'listas.json'  # primeros videos de cada lista, para las vistas previas
VIDEOS_POR_LISTA = 6
MAXIMO = int(sys.argv[sys.argv.index('--max') + 1]) if '--max' in sys.argv else None

# Muchos MV tienen el título solo en coreano. Para poder buscarlos por su nombre conocido,
# se añade el nombre en inglés cuando el título contiene alguno de estos textos.
ALIAS = {
    '음악의 신': 'God of Music', '손오공': 'Super', '아낀다': 'Adore U', '만세': 'Mansae', '예쁘다': 'Pretty U',
    '아주 NICE': 'Very Nice', '붐붐': 'Boom Boom', '울고 싶지 않아': "Don't Wanna Cry", '박수': 'Clap',
    '고맙다': 'Thanks', '어쩌나': 'Oh My!', '우리의 새벽은 낮보다 뜨겁다': 'Our Dawn Is Hotter Than Day',
    '사랑쪽지': 'Love Letter', '바람개비': 'Pinwheel',
    '숨이 차': 'Getting Closer', '지금 널 찾아가고 있어': 'Run to You', '청춘찬가': 'Cheers to Youth',
    '어른 아이': 'Kidult', '레디 투 러브': 'Ready to Love', '파이팅 해야지': 'Fighting',
}
IGNORAR = {'[Private video]', '[Deleted video]', '[Video privado]', '[Video eliminado]'}


def listas_del_contenido():
    """(id de lista, etiqueta) de todas las listas de YouTube de la hoja, sin repetir."""
    miembros = {r['ID']: r['Nombre'] for r in csv.DictReader(open(CONTENIDO / 'Miembros.csv', encoding='utf-8'))}
    paginas = {r['Pagina']: r['Titulo'] for r in csv.DictReader(open(CONTENIDO / 'Paginas.csv', encoding='utf-8'))}
    vistas, listas = set(), []

    def agregar(url, etiqueta):
        u = urllib.parse.urlsplit(url)
        q = dict(urllib.parse.parse_qsl(u.query))
        if 'youtu' in u.netloc and 'list' in q and 'v' not in q and q['list'] not in vistas:
            vistas.add(q['list'])
            listas.append((q['list'], etiqueta))

    for r in csv.DictReader(open(CONTENIDO / 'Enlaces.csv', encoding='utf-8')):
        agregar(r['URL_Video'], r['Titulo'])
    for r in csv.DictReader(open(CONTENIDO / 'Contenido.csv', encoding='utf-8')):
        agregar(r['URL_Video'], ' · '.join(x for x in (paginas.get(r['Pagina'], r['Pagina']), r['Titulo']) if x))
    for nombre in ('Musica', 'Programas'):
        for r in csv.DictReader(open(CONTENIDO / f'{nombre}.csv', encoding='utf-8')):
            agregar(r['URL_Video'], f"{miembros.get(r['Miembro'], r['Miembro'])} · {r['Titulo']}")
    return listas


def videos_de(lista_id):
    opciones = {'extract_flat': 'in_playlist', 'quiet': True, 'no_warnings': True, 'skip_download': True}
    with yt_dlp.YoutubeDL(opciones) as ydl:
        info = ydl.extract_info(f'https://www.youtube.com/playlist?list={lista_id}', download=False)
    return [(e['id'], e.get('title') or '') for e in info.get('entries') or [] if e and e.get('id')]


def main():
    listas = listas_del_contenido()[:MAXIMO]
    print(f'Listas a leer: {len(listas)}')
    videos, fallidas, por_lista = {}, [], {}
    with cf.ThreadPoolExecutor(4) as ex:
        futuros = {ex.submit(videos_de, lid): (lid, etiqueta) for lid, etiqueta in listas}
        for n, fu in enumerate(cf.as_completed(futuros), 1):
            lid, etiqueta = futuros[fu]
            try:
                entradas = [(vid, titulo) for vid, titulo in fu.result() if titulo not in IGNORAR]
                if entradas:
                    por_lista[lid] = [vid for vid, _ in entradas[:VIDEOS_POR_LISTA]]
                for vid, titulo in entradas:
                    if vid in videos:
                        continue
                    alias = next((ing for kor, ing in ALIAS.items() if kor in titulo), '')
                    videos[vid] = {'id': vid, 'titulo': titulo, 'lista': etiqueta, **({'alias': alias} if alias else {})}
            except Exception as e:  # lista privada, borrada o bloqueada
                fallidas.append((lid, etiqueta, str(e).splitlines()[0][:120]))
            if n % 25 == 0:
                print(f'  {n}/{len(listas)} listas · {len(videos)} videos')

    SALIDA.write_text(json.dumps({
        'generado': datetime.date.today().isoformat(),
        'listas': len(listas) - len(fallidas),
        'videos': list(videos.values()),
    }, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    SALIDA_LISTAS.write_text(json.dumps(por_lista, separators=(',', ':')), encoding='utf-8')
    print(f'Listo: {len(videos)} videos de {len(listas) - len(fallidas)} listas → {SALIDA.relative_to(RAIZ)}')
    if fallidas:
        print(f'Listas que no se pudieron leer ({len(fallidas)}):')
        for lid, etiqueta, error in fallidas:
            print(f'  - {etiqueta} ({lid}): {error}')


if __name__ == '__main__':
    main()
