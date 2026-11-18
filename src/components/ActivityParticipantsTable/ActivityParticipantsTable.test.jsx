import React from 'react';
import { screen, waitFor } from '@testing-library/react';
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
});
