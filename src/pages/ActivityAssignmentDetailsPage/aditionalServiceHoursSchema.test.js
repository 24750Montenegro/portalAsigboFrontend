import aditionalServiceHoursSchema from './aditionalServiceHoursSchema';

const isValid = (baseHours, value) => aditionalServiceHoursSchema(baseHours)
  .isValid({ aditionalServiceHours: value });

describe('aditionalServiceHoursSchema', () => {
  it('acepta un ajuste negativo mientras base + ajuste no baje de 0', async () => {
    expect(await isValid(15, -10)).toBe(true);
    expect(await isValid(15, -15)).toBe(true);
  });

  it('rechaza un ajuste que deja las horas totales por debajo de 0', async () => {
    expect(await isValid(15, -16)).toBe(false);
  });

  it('sigue aceptando ajustes positivos y 0, y rechazando decimales y vacío', async () => {
    expect(await isValid(4, 2)).toBe(true);
    expect(await isValid(4, 0)).toBe(true);
    expect(await isValid(4, 1.5)).toBe(false);
    expect(await isValid(4, undefined)).toBe(false);
  });

  it('el mensaje de error del mínimo explica la regla', async () => {
    await expect(aditionalServiceHoursSchema(15).validate({ aditionalServiceHours: -16 }))
      .rejects.toThrow('Las horas totales (base + adicionales) no pueden ser menores que cero.');
  });
});
