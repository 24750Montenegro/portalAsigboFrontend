import { formatDay, formatGuatemalaDateTime, hoursRowStatusLabel } from './hoursImportPreview';

describe('hoursRowStatusLabel', () => {
  it.each([
    ['crea_actividad', 'Crea actividad'],
    ['asignacion_nueva', 'Asignación nueva'],
    ['completa_asignacion', 'Completa asignación pendiente'],
    ['ya_existia', 'Ya existía (no suma)'],
  ])('traduce %s', (status, label) => {
    expect(hoursRowStatusLabel({ status })).toBe(label);
  });

  it('una fila con error muestra el motivo', () => {
    expect(hoursRowStatusLabel({ status: 'error', error: 'carnet_desconocido' })).toBe('Error: No existe un becado con ese carné');
  });
});

describe('formatDay', () => {
  it('muestra el día como DD/MM/AAAA', () => {
    expect(formatDay('2026-05-08')).toBe('08/05/2026');
  });

  it('sin día devuelve un guion', () => {
    expect(formatDay(null)).toBe('—');
  });
});

describe('formatGuatemalaDateTime', () => {
  it('muestra el instante en hora de Guatemala (UTC-6) sin depender de la zona del navegador', () => {
    expect(formatGuatemalaDateTime('2026-05-08T14:00:00.000Z')).toBe('08/05/2026 08:00');
    expect(formatGuatemalaDateTime('2026-05-09T02:30:00.000Z')).toBe('08/05/2026 20:30');
  });

  it('sin fecha devuelve un guion', () => {
    expect(formatGuatemalaDateTime(null)).toBe('—');
  });
});
