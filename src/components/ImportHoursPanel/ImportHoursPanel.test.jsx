import React from 'react';
import { render, screen } from '@testing-library/react';
import SessionContext from '@/context/SessionContext';
import ImportHoursPanel from './ImportHoursPanel';

const renderPanel = (mode) => render(
  <SessionContext.Provider value={{ accessToken: 'token', setAccessToken: () => {}, accessTokenRef: { current: 'token' } }}>
    <ImportHoursPanel mode={mode} idActivity="abc" />
  </SessionContext.Provider>,
);

describe('ImportHoursPanel — texto de ayuda', () => {
  it.each(['AAAA-MM-DD HH:mm', 'AAAA-MM-DD', 'DD/MM/AAAA HH:mm', 'DD/MM/AAAA'])(
    'en el modo varias actividades lista el formato de fecha %s',
    (format) => {
      renderPanel('multi');

      expect(screen.getByText(format, { selector: 'code' })).toBeInTheDocument();
    },
  );

  it('aclara que la fecha con barras es día/mes y en hora de Guatemala', () => {
    renderPanel('multi');

    expect(screen.getByText(/día\/mes/i)).toBeInTheDocument();
    expect(screen.getByText(/hora de Guatemala/i)).toBeInTheDocument();
  });

  it('acepta el CSV separado por comas o por punto y coma', () => {
    renderPanel('activity');

    expect(screen.getByText(/comas o punto y coma/i)).toBeInTheDocument();
  });
});
