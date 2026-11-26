import {
  adjustmentLabel, effectiveServiceHours, hoursLabel, serviceHoursText,
} from './serviceHours';

describe('serviceHours', () => {
  it('hoursLabel usa singular solo para 1', () => {
    expect(hoursLabel(1)).toBe('1 hora');
    expect(hoursLabel(0)).toBe('0 horas');
    expect(hoursLabel(3)).toBe('3 horas');
  });

  it('effectiveServiceHours suma el ajuste sin bajar de 0', () => {
    expect(effectiveServiceHours(4, 2)).toBe(6);
    expect(effectiveServiceHours(4, -10)).toBe(0);
    expect(effectiveServiceHours(4, null)).toBe(4);
    expect(effectiveServiceHours(4)).toBe(4);
  });

  it('adjustmentLabel indica el signo del ajuste', () => {
    expect(adjustmentLabel(2)).toBe('+2 horas');
    expect(adjustmentLabel(-1)).toBe('−1 hora');
    expect(adjustmentLabel(0)).toBe('0 horas');
    expect(adjustmentLabel()).toBe('0 horas');
  });

  it('serviceHoursText incluye el desglose cuando hay ajuste', () => {
    expect(serviceHoursText(4)).toBe('4 horas');
    expect(serviceHoursText(4, 1)).toBe('5 horas (4 base + 1 adicional)');
    expect(serviceHoursText(15, -10)).toBe('5 horas (15 base − 10 de ajuste)');
  });
});
