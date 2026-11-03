/**
 * Configuración del sitio.
 *
 * Aquí van las URLs CSV de cada pestaña de la hoja de Google Sheets. Es el único sitio del código donde aparecen.
 * Cómo obtenerlas: en la hoja, Archivo → Compartir → Publicar en la web →
 * elegir la pestaña → "Valores separados por comas (.csv)" → Publicar → copiar el enlace.
 *
 * Mientras estén vacías, la web muestra los esqueletos de carga (Fase 0 pendiente).
 */
export const HOJAS = {
  portada: '',
  miembros: '',
  enlaces: '',
  musica: '',
  programas: '',
  redes: '',
  creditos: '',
};

/** Tiempo máximo de espera por pestaña antes de usar la copia guardada (CU-01, 2a). */
export const TIEMPO_ESPERA_MS = 8000;

/** Imagen de reserva para cualquier <img> que falle (RF-31). */
export const IMAGEN_RESERVA = 'img/placeholder.svg';
