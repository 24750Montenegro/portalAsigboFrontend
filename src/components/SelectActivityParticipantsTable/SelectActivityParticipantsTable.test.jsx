import React from 'react';
import {
  screen, waitFor, fireEvent, within,
} from '@testing-library/react';
import { vi } from 'vitest';
import {
  renderWithApp, mockFetch, stubMatchMedia, promotionsReply,
} from '@/test/renderWithApp';
import SelectActivityParticipantsTable from './SelectActivityParticipantsTable';

const ana = {
  id: 'u1', name: 'Ana', lastname: 'Pérez', promotion: 2023,
};
const luis = {
  id: 'u2', name: 'Luis', lastname: 'García', promotion: 2022,
};
const candidate = {
  id: 'u9', name: 'Carla', lastname: 'Ruiz', promotion: 2023,
};

const participantsPage = {
  total: 9,
  pages: 2,
  resultsPerPage: 7,
  result: [
    { id: 'a1', user: ana, completed: false },
    { id: 'a2', user: luis, completed: true },
  ],
};

const api = ({ participants = participantsPage } = {}) => mockFetch((url, init) => {
  if (url.pathname.endsWith('/promotion')) return promotionsReply;
  if (url.pathname.endsWith('/activity/act1/assignment/bulk') && init.method === 'POST') {
    return { status: 204, body: null };
  }
  if (url.pathname.endsWith('/activity/act1/assignment')) return { body: participants };
  if (url.pathname.endsWith('/user')) {
    return { body: { result: [candidate], pages: 1, resultsPerPage: 7 } };
  }
  return undefined;
});

const participantCalls = (fetchMock) => fetchMock.mock.calls
  .map(([uri]) => new URL(uri, 'http://localhost'))
  .filter((url) => url.pathname.endsWith('/activity/act1/assignment'));

describe('SelectActivityParticipantsTable', () => {
  beforeEach(() => stubMatchMedia());
  afterEach(() => vi.unstubAllGlobals());

  it('muestra solo a los asignados, con su estado y el total', async () => {
    const fetchMock = api();

    renderWithApp(<SelectActivityParticipantsTable idActivity="act1" />);

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Luis García')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Asignado' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Completado' })).toBeInTheDocument();
    expect(screen.getByText(/9 participantes/i)).toBeInTheDocument();
    expect(screen.queryByText('No asignado')).not.toBeInTheDocument();

    // Nunca consulta el listado general de usuarios para pintar la tabla.
    const userCalls = fetchMock.mock.calls.filter(([uri]) => new URL(uri, 'http://localhost').pathname.endsWith('/user'));
    expect(userCalls).toHaveLength(0);
    expect(participantCalls(fetchMock)[0].searchParams.get('page')).toBe('0');
  });

  it('el filtro de estado ofrece los estados reales y filtra en el servidor', async () => {
    const fetchMock = api();
    renderWithApp(<SelectActivityParticipantsTable idActivity="act1" />);
    await screen.findByText('Ana Pérez');

    const statusSelect = screen.getByDisplayValue('Estado');
    const options = within(statusSelect).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Estado', 'Asignado', 'Completado']);

    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    await waitFor(() => {
      const last = participantCalls(fetchMock).at(-1);
      expect(last.searchParams.get('status')).toBe('completed');
      expect(last.searchParams.get('page')).toBe('0');
    });
  });

  it('muestra un mensaje cuando la actividad no tiene participantes', async () => {
    api({
      participants: {
        total: 0, pages: 0, resultsPerPage: 7, result: [],
      },
    });

    renderWithApp(<SelectActivityParticipantsTable idActivity="act1" />);

    expect(await screen.findByText(/0 participantes/i)).toBeInTheDocument();
  });

  it('«Agregar participantes» lista solo candidatos no asignados y los asigna de una vez', async () => {
    const fetchMock = api();
    renderWithApp(<SelectActivityParticipantsTable idActivity="act1" />);
    await screen.findByText('Ana Pérez');
    const callsBefore = participantCalls(fetchMock).length;

    fireEvent.click(screen.getByRole('button', { name: 'Agregar participantes' }));

    expect(await screen.findByText('Carla Ruiz')).toBeInTheDocument();
    const userCall = fetchMock.mock.calls
      .map(([uri]) => new URL(uri, 'http://localhost'))
      .find((url) => url.pathname.endsWith('/user'));
    expect(userCall.searchParams.get('excludeAssignedTo')).toBe('act1');

    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Asignar 1 seleccionado(s)' }));

    await waitFor(() => {
      const bulk = fetchMock.mock.calls.find(([uri]) => String(uri).endsWith('/activity/act1/assignment/bulk'));
      expect(bulk).toBeDefined();
      expect(bulk[1].method).toBe('POST');
      expect(JSON.parse(bulk[1].body)).toEqual({ idUsers: ['u9'] });
    });
    // Tras asignar, la tabla se recarga.
    await waitFor(() => expect(participantCalls(fetchMock).length).toBeGreaterThan(callsBefore));
  });
});
