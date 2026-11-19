import { hasStudentIds, showStudentIdColumn } from './studentIdColumn';

describe('showStudentIdColumn', () => {
  const sinCarne = [{ id: 'u1' }, { id: 'u2', studentId: '' }];
  const conCarne = [{ id: 'u1', studentId: '25781' }];

  it.each([
    ['admin'],
    ['asigboAreaResponsible'],
    ['activityResponsible'],
  ])('muestra la columna a %s aunque ninguna fila tenga carné', (role) => {
    expect(showStudentIdColumn(sinCarne, [role])).toBe(true);
    expect(showStudentIdColumn([], [role])).toBe(true);
  });

  it('a los demás roles solo la muestra si alguna fila trae carné', () => {
    expect(showStudentIdColumn(sinCarne, ['scolarshipHolder'])).toBe(false);
    expect(showStudentIdColumn(conCarne, ['scolarshipHolder'])).toBe(true);
  });

  it('tolera roles ausentes (sesión aún no cargada)', () => {
    expect(showStudentIdColumn(sinCarne, undefined)).toBe(false);
    expect(showStudentIdColumn(conCarne, null)).toBe(true);
  });

  it('hasStudentIds sigue igual', () => {
    expect(hasStudentIds(sinCarne)).toBe(false);
    expect(hasStudentIds(conCarne)).toBe(true);
  });
});
