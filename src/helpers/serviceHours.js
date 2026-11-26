export const hoursLabel = (hours) => `${hours} ${Math.abs(hours) === 1 ? 'hora' : 'horas'}`;

export const effectiveServiceHours = (baseHours, adjustment = 0) => (
  Math.max(0, baseHours + (adjustment ?? 0))
);

export const adjustmentLabel = (adjustment = 0) => {
  if (!adjustment) return hoursLabel(0);
  return `${adjustment > 0 ? '+' : '−'}${hoursLabel(Math.abs(adjustment))}`;
};

/**
 * Horas efectivas del becado con el desglose cuando hay ajuste. El ajuste es negativo cuando se
 * le registraron menos horas que las base (p. ej. por CSV).
 */
export const serviceHoursText = (baseHours, adjustment = 0) => {
  if (!adjustment) return hoursLabel(baseHours);
  const total = hoursLabel(effectiveServiceHours(baseHours, adjustment));
  if (adjustment > 0) {
    return `${total} (${baseHours} base + ${adjustment} ${adjustment > 1 ? 'adicionales' : 'adicional'})`;
  }
  return `${total} (${baseHours} base − ${-adjustment} de ajuste)`;
};
