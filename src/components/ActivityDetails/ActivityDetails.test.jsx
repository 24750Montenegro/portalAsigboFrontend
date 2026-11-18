import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivityDetails from './ActivityDetails';

const activity = (serviceHours, userAssignment) => ({
  name: 'Fix',
  asigboArea: { name: 'Prueba Assignment' },
  date: '2026-05-08T14:00:00.000Z',
  serviceHours,
  availableSpaces: 3,
  registrationStartDate: '2026-05-01T00:00:00.000Z',
  registrationEndDate: '2026-05-07T00:00:00.000Z',
  participatingPromotions: null,
  userAssignment,
});

const hoursField = () => screen.getByText('Horas de servicio').nextSibling;

describe('ActivityDetails — horas de servicio', () => {
  it('sin asignación muestra las horas base de la actividad', () => {
    render(<ActivityDetails data={activity(15)} />);

    expect(hoursField()).toHaveTextContent(/^15 horas$/);
  });

  it('con ajuste negativo muestra las horas efectivas del becado y el ajuste restado', () => {
    const data = activity(15, { completed: true, aditionalServiceHours: -10 });
    render(<ActivityDetails data={data} />);

    expect(hoursField()).toHaveTextContent(/^5 horas \(15 base − 10 de ajuste\)$/);
  });

  it('con horas adicionales muestra el total efectivo y las adicionales sumadas', () => {
    render(<ActivityDetails data={activity(4, { completed: true, aditionalServiceHours: 2 })} />);

    expect(hoursField()).toHaveTextContent(/^6 horas \(4 base \+ 2 adicionales\)$/);
  });

  it('con ajuste 0 muestra solo las horas base, en singular si es 1', () => {
    render(<ActivityDetails data={activity(1, { completed: true, aditionalServiceHours: 0 })} />);

    expect(hoursField()).toHaveTextContent(/^1 hora$/);
  });
});
