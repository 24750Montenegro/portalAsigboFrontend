import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithApp, mockFetch, stubMatchMedia } from '@/test/renderWithApp';
import ActivityResponsibles from './ActivityResponsibles';

const responsible = {
  id: 'r1', name: 'Rosa', lastname: 'Encargada', promotion: 2022,
};
const candidate = {
  id: 'u9', name: 'Carla', lastname: 'Ruiz', promotion: 2023,
};
const activity = { id: 'act1', name: 'Actividad', responsible: [responsible] };

const api = () => mockFetch((url, init) => {
  if (url.pathname.endsWith('/activity/act1') && init.method === 'PATCH') return { body: null };
  if (url.pathname.endsWith('/activity/act1')) {
    return { body: { ...activity, responsible: [responsible, candidate] } };
  }
  if (url.pathname.endsWith('/user')) return { body: { result: [candidate], pages: 1, resultsPerPage: 7 } };
  return undefined;
});

const urls = (fetchMock) => fetchMock.mock.calls.map(([uri]) => new URL(uri, 'http://localhost'));

describe('ActivityResponsibles', () => {
  beforeEach(() => stubMatchMedia());
  afterEach(() => vi.unstubAllGlobals());

  it('muestra solo a los encargados asignados, con el total, sin pedir el listado de usuarios', () => {
    const fetchMock = api();

    renderWithApp(<ActivityResponsibles activityData={activity} canManage />);

    expect(screen.getByText('Rosa Encargada')).toBeInTheDocument();
    expect(screen.getByText(/1 encargado\b/i)).toBeInTheDocument();
    expect(urls(fetchMock).some((url) => url.pathname.endsWith('/user'))).toBe(false);
  });

  it('sin permisos de gestión no ofrece agregar encargados', () => {
    api();

    renderWithApp(<ActivityResponsibles activityData={activity} canManage={false} />);

    expect(screen.queryByRole('button', { name: 'Agregar encargados' })).not.toBeInTheDocument();
  });

  it('«Agregar encargados» excluye a los actuales y guarda la lista ampliada', async () => {
    const fetchMock = api();
    const onChange = vi.fn();
    renderWithApp(<ActivityResponsibles activityData={activity} canManage onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Agregar encargados' }));

    expect(await screen.findByText('Carla Ruiz')).toBeInTheDocument();
    const userCall = urls(fetchMock).find((url) => url.pathname.endsWith('/user'));
    expect(userCall.searchParams.getAll('exclude')).toEqual(['r1']);

    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar 1 seleccionado(s)' }));

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
      expect(patch).toBeDefined();
      expect(new URL(patch[0], 'http://localhost').pathname).toMatch(/\/activity\/act1$/);
      expect(patch[1].body.getAll('responsible[]')).toEqual(['r1', 'u9']);
    });
    // Recarga los encargados y avisa a la página.
    expect(await screen.findByRole('cell', { name: 'Carla Ruiz' })).toBeInTheDocument();
    expect(screen.getByText(/2 encargados/i)).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();
  });
});
