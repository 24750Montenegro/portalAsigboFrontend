import hoursImportErrorLabel from './hoursImportErrors';

/** Resultado de cada fila de la vista previa (`rows[].status` del backend), en español. */
const statusLabels = {
  crea_actividad: 'Crea actividad',
  asignacion_nueva: 'Asignación nueva',
  completa_asignacion: 'Completa asignación pendiente',
  ya_existia: 'Ya existía (no suma)',
};

export function hoursRowStatusLabel({ status, error }) {
  if (status === 'error') return `Error: ${hoursImportErrorLabel(error)}`;
  return statusLabels[status] ?? status;
}

const EMPTY = '—';
const pad = (value) => String(value).padStart(2, '0');

/** `AAAA-MM-DD` → `DD/MM/AAAA`. */
export function formatDay(day) {
  if (!day) return EMPTY;
  const [year, month, dayOfMonth] = day.split('-');
  return `${dayOfMonth}/${month}/${year}`;
}

/** UTC-6 fijo: Guatemala no aplica horario de verano. */
const GUATEMALA_OFFSET_MS = 6 * 3_600_000;

/** Un instante ISO en hora de Guatemala, `DD/MM/AAAA HH:mm`, sea cual sea la zona del navegador. */
export function formatGuatemalaDateTime(iso) {
  if (!iso) return EMPTY;
  const local = new Date(new Date(iso).getTime() - GUATEMALA_OFFSET_MS);
  return `${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)}/${local.getUTCFullYear()} `
    + `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
}
