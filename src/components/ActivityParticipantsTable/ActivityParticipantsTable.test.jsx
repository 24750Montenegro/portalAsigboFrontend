import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithApp, mockFetch, stubMatchMedia } from '@/test/renderWithApp';
import ActivityParticipantsTable from './ActivityParticipantsTable';

const page = {
  total: 8,
  pages: 2,
  resultsPerPage: 7,
  result: [
    {
      id: 'a1',
      user: {
        id: 'u1', name: 'Ana', lastname: 'Pérez', promotion: 2023,
      },
      completed: false,
    },
  ],
};

describe('ActivityParticipantsTable (vista de solo lectura)', () => {
  beforeEach(() => stubMatchMedia());
  afterEach(() => vi.unstubAllGlobals());

  it('muestra a los asignados de la página y el total', async () => {
    const fetchMock = mockFetch((url) => (url.pathname.endsWith('/activity/act1/assignment') ? { body: page } : undefined));

    renderWithApp(<ActivityParticipantsTable idActivity="act1" />);

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText(/8 participantes/i)).toBeInTheDocument();
    await waitFor(() => {
      const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost');
      expect(url.searchParams.get('page')).toBe('0');
    });
  });

  it('«Actualizar» vuelve a pedir la misma página y muestra los datos nuevos', async () => {
    let refreshed = false;
    const carla = {
      id: 'a2',
      user: {
        id: 'u9', name: 'Carla', lastname: 'Ruiz', promotion: 2023,
      },
      completed: true,
    };
    const fetchMock = mockFetch((url) => {
      if (!url.pathname.endsWith('/activity/act1/assignment')) return undefined;
      return { body: refreshed ? { ...page, result: [carla] } : page };
    });
    const calls = () => fetchMock.mock.calls.map(([uri]) => new URL(uri, 'http://localhost'));

    renderWithApp(<ActivityParticipantsTable idActivity="act1" />);
    await screen.findByText('Ana Pérez');
    fireEvent.click(screen.getByRole('button', { name: /page 2/i }));
    await waitFor(() => expect(calls().at(-1).searchParams.get('page')).toBe('1'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Actualizar' })).toBeEnabled());
    const before = calls().length;

    refreshed = true;
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    expect(await screen.findByText('Carla Ruiz')).toBeInTheDocument();
    expect(calls()).toHaveLength(before + 1);
    expect(calls().at(-1).searchParams.get('page')).toBe('1');
  });

  it('muestra el error si la recarga falla', async () => {
    let fail = false;
    mockFetch((url) => {
      if (!url.pathname.endsWith('/activity/act1/assignment')) return undefined;
      return fail ? { status: 500, body: { err: 'Servidor caído.' } } : { body: page };
    });

    renderWithApp(<ActivityParticipantsTable idActivity="act1" />);
    await screen.findByText('Ana Pérez');
    fail = true;
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor caído.');
  });
});
