import React from 'react';
import { render, screen } from '@testing-library/react';

describe('entorno de pruebas', () => {
  it('renderiza un componente con jsdom', () => {
    render(<p>hola</p>);
    expect(screen.getByText('hola')).toBeInTheDocument();
  });
});
