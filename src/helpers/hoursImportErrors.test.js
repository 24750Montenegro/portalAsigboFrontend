import hoursImportErrorLabel from './hoursImportErrors';

describe('hoursImportErrorLabel', () => {
  it('el error de fecha lista todos los formatos aceptados', () => {
    const label = hoursImportErrorLabel('fecha_invalida');

    ['AAAA-MM-DD HH:mm', 'AAAA-MM-DD', 'DD/MM/AAAA HH:mm', 'DD/MM/AAAA'].forEach((format) => {
      expect(label).toContain(format);
    });
  });

  it('el error de fecha dice que la hora admite segundos', () => {
    expect(hoursImportErrorLabel('fecha_invalida')).toMatch(/HH:mm:ss/);
  });
});
