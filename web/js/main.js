/**
 * Arranque de SVTFLIX: prepara la página, carga los datos y pinta la vista que pida la URL.
 */
import { IMAGEN_RESERVA } from './config.js';
import { cargarTodo } from './datos.js';
import { pintarCatalogo, pintarCreditos, pintarNavegacion, pintarPortada, pintarRedes, pintarTop13 } from './ui/inicio.js';
import { activarVistaPrevia } from './ui/vista-previa.js';
import { crearIndice } from './buscar.js';
import { activarBuscador, vistaBusqueda } from './ui/busqueda.js';
import { vistaMiembro, vistaPagina } from './ui/vistas.js';

/** Cambia por la imagen de reserva cualquier <img> que falle, una sola vez (RF-31). */
function activarImagenesDeReserva() {
  document.addEventListener(
    'error',
    (evento) => {
      const img = evento.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.reserva) return;
      img.dataset.reserva = 'si';
      img.src = IMAGEN_RESERVA;
    },
    true, // los errores de imagen no burbujean: se escuchan en fase de captura
  );
}

/** Oscurece la cabecera al bajar para que el logo se lea sobre cualquier fondo. */
function activarCabeceraAlHacerScroll() {
  const cabecera = document.getElementById('cabecera');
  const actualizar = () => {
    cabecera.classList.toggle('bg-fondo/95', window.scrollY > 40);
    cabecera.classList.toggle('backdrop-blur', window.scrollY > 40);
    cabecera.classList.toggle('shadow-lg', window.scrollY > 40);
  };
  window.addEventListener('scroll', actualizar, { passive: true });
  actualizar();
}

/** Pinta esqueletos en los contenedores marcados mientras no hay datos (HU-26). */
function pintarEsqueletos() {
  document.querySelectorAll('[data-esqueleto="tarjetas-verticales"]').forEach((contenedor) => {
    for (let i = 0; i < 6; i++) {
      const bloque = document.createElement('div');
      bloque.className = 'esqueleto aspect-[2/3] w-32 shrink-0 sm:w-40';
      contenedor.append(bloque);
    }
  });
}

/** Enrutador mínimo con el hash: #/miembro/<id> y #/pagina/<id>. Todo lo demás es el inicio. */
function crearEnrutador(datos) {
  const inicio = document.getElementById('contenido');
  const detalle = document.getElementById('detalle');
  let scrollInicio = 0;

  return function enrutar() {
    const [, tipo, id] = location.hash.match(/^#\/(miembro|pagina|buscar)\/(.+)$/) || [];
    if (tipo) {
      if (!inicio.hidden) scrollInicio = window.scrollY;
      const valor = decodeURIComponent(id);
      const vista = tipo === 'buscar' ? vistaBusqueda(valor) : (tipo === 'miembro' ? vistaMiembro : vistaPagina)(datos, valor);
      detalle.replaceChildren(vista);
      inicio.hidden = true;
      detalle.hidden = false;
      window.scrollTo(0, 0);
    } else if (inicio.hidden) {
      detalle.hidden = true;
      detalle.replaceChildren(); // detiene los videos de la vista anterior
      inicio.hidden = false;
      // Si se llegó con un ancla (p. ej. desde la navegación), ir a esa sección; si no, volver a donde estaba.
      const ancla = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
      if (ancla) ancla.scrollIntoView();
      else window.scrollTo(0, scrollInicio);
    }
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('anio').textContent = new Date().getFullYear();
  activarImagenesDeReserva();
  activarCabeceraAlHacerScroll();
  pintarEsqueletos();

  const datos = await cargarTodo();
  pintarPortada(document.getElementById('portada'), datos.portada);
  pintarTop13(document.getElementById('miembros'), datos.miembros);
  pintarRedes(datos);
  pintarCatalogo(document.getElementById('catalogo'), datos.enlaces);
  pintarCreditos(document.getElementById('lista-creditos'), datos.creditos);
  pintarNavegacion(document.getElementById('navegacion'), datos.enlaces);
  activarVistaPrevia();

  crearIndice(datos);
  const enrutar = crearEnrutador(datos);
  window.addEventListener('hashchange', enrutar);
  activarBuscador(enrutar);
  enrutar();
});
