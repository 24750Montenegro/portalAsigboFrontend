import * as yup from 'yup';

/**
 * El ajuste puede ser negativo (actividades con horas variables por becado, p. ej. una
 * carga por CSV con menos horas que las base), pero las horas totales de la asignación
 * (base + ajuste) nunca bajan de 0.
 */
const aditionalServiceHoursSchema = (baseHours = 0) => yup.object().shape({
  aditionalServiceHours: yup
    .number()
    .nullable()
    .typeError('Las horas de servicio adicionales deben ser un número.')
    .integer('Las horas de servicio adicionales deben ser un entero.')
    .min(-baseHours, 'Las horas totales (base + adicionales) no pueden ser menores que cero.')
    .required('Ingresa un valor.'),
});

export default aditionalServiceHoursSchema;
