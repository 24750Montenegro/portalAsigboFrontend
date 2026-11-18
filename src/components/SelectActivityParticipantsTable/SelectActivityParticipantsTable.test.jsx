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

  describe('botón «Actualizar»', () => {
    const activityInfo = { id: 'act1', name: 'Actividad', serviceHours: 2 };
    const beforeImport = {
      total: 9,
      pages: 2,
      resultsPerPage: 7,
      result: [{
        id: 'a1', user: ana, activity: activityInfo, completed: false, aditionalServiceHours: 0,
      }],
    };
    const afterImport = {
      ...beforeImport,
      result: [{
        id: 'a1', user: ana, activity: activityInfo, completed: true, aditionalServiceHours: 3,
      }],
    };

    /** Responde `beforeImport` hasta que se llame a `importDone()`; luego `afterImport` o `reply()`. */
    const refreshApi = ({ reply } = {}) => {
      let imported = false;
      const fetchMock = mockFetch((url) => {
        if (url.pathname.endsWith('/promotion')) return promotionsReply;
        if (url.pathname.endsWith('/activity/act1/assignment')) {
          if (!imported) return { body: beforeImport };
          return reply ? reply() : { body: afterImport };
        }
        return undefined;
      });
      return { fetchMock, importDone: () => { imported = true; } };
    };

    /** Filtra por «Asignado» y pasa a la página 2, como haría quien revisa tras importar. */
    const goToFilteredSecondPage = async (fetchMock) => {
      await screen.findByText('Ana Pérez');
      fireEvent.change(screen.getByDisplayValue('Estado'), { target: { value: 'pending' } });
      await waitFor(() => expect(participantCalls(fetchMock).at(-1).searchParams.get('status')).toBe('pending'));
      fireEvent.click(screen.getByRole('button', { name: /page 2/i }));
      await waitFor(() => expect(participantCalls(fetchMock).at(-1).searchParams.get('page')).toBe('1'));
      await screen.findByText('Ana Pérez');
    };

    it('vuelve a pedir la misma página con los mismos filtros y muestra estado y horas nuevos', async () => {
      const { fetchMock, importDone } = refreshApi();
      renderWithApp(<SelectActivityParticipantsTable idActivity="act1" />);
      await goToFilteredSecondPage(fetchMock);

      expect(screen.getByRole('cell', { name: 'Asignado' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '2' })).toBeInTheDocument();
      const callsBefore = participantCalls(fetchMock).length;

      importDone();
      fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

      await waitFor(() => expect(participantCalls(fetchMock).length).toBe(callsBefore + 1));
      const refresh = participantCalls(fetchMock).at(-1);
      expect(refresh.searchParams.get('page')).toBe('1');
      expect(refresh.searchParams.get('status')).toBe('pending');

      expect(await screen.findByRole('cell', { name: 'Completado' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '5' })).toBeInTheDocument();
      // Sigue en la página 2.
      expect(screen.getByRole('button', { name: /page 2/i })).toHaveAttribute('aria-current', 'true');
    });

    it('queda deshabilitado mientras recarga', async () => {
      let release;
      const { fetchMock, importDone } = refreshApi({
        reply: () => new Promise((resolve) => { release = () => resolve({ body: afterImport }); }),
      });
      renderWithApp(<SelectActivityParticipantsTable idActivity="act1" />);
      await screen.findByText('Ana Pérez');

      importDone();
      const button = screen.getByRole('button', { name: 'Actualizar' });
      expect(button).toBeEnabled();
      fireEvent.click(button);

      await waitFor(() => expect(screen.getByRole('button', { name: 'Actualizar' })).toBeDisabled());
      expect(screen.getByRole('button', { name: 'Actualizar' })).toHaveAttribute('aria-busy', 'true');

      release();
      await waitFor(() => expect(screen.getByRole('button', { name: 'Actualizar' })).toBeEnabled());
      expect(await screen.findByRole('cell', { name: 'Completado' })).toBeInTheDocument();
      expect(participantCalls(fetchMock).length).toBeGreaterThan(1);
    });

    it('muestra el error si la recarga falla', async () => {
      const { importDone } = refreshApi({
        reply: () => ({ status: 500, body: { err: 'No se pudo cargar la lista.' } }),
      });
      renderWithApp(<SelectActivityParticipantsTable idActivity="act1" />);
      await screen.findByText('Ana Pérez');

      importDone();
      fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la lista.');
    });
  });
});
