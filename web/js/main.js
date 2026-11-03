/**
 * Arranque de SVTFLIX.
 * Fase 1: solo prepara la página. La carga de datos de Google Sheets llega en la Fase 2.
 */
import { IMAGEN_RESERVA } from './config.js';

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

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('anio').textContent = new Date().getFullYear();
  activarImagenesDeReserva();
  activarCabeceraAlHacerScroll();
  pintarEsqueletos();
});
