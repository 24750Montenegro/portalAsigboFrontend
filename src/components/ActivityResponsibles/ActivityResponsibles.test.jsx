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

  describe('botón «Actualizar»', () => {
    it('vuelve a pedir la actividad y muestra los encargados actuales', async () => {
      const fetchMock = api();
      renderWithApp(<ActivityResponsibles activityData={activity} />);
      expect(screen.queryByRole('cell', { name: 'Carla Ruiz' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

      expect(await screen.findByRole('cell', { name: 'Carla Ruiz' })).toBeInTheDocument();
      expect(screen.getByText(/2 encargados/i)).toBeInTheDocument();
      const gets = urls(fetchMock).filter((url) => /\/activity\/act1$/.test(url.pathname));
      expect(gets).toHaveLength(1);
    });

    it('queda deshabilitado mientras recarga', async () => {
      let release;
      mockFetch((url) => {
        if (!url.pathname.endsWith('/activity/act1')) return undefined;
        return new Promise((resolve) => {
          release = () => resolve({ body: { ...activity, responsible: [responsible, candidate] } });
        });
      });
      renderWithApp(<ActivityResponsibles activityData={activity} />);

      fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

      await waitFor(() => expect(screen.getByRole('button', { name: 'Actualizar' })).toBeDisabled());
      expect(screen.getByRole('button', { name: 'Actualizar' })).toHaveAttribute('aria-busy', 'true');
      release();
      expect(await screen.findByRole('cell', { name: 'Carla Ruiz' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Actualizar' })).toBeEnabled();
    });

    it('muestra el error si la recarga falla y conserva la lista', async () => {
      mockFetch((url) => (url.pathname.endsWith('/activity/act1')
        ? { status: 500, body: { err: 'No se pudo cargar la actividad.' } }
        : undefined));
      renderWithApp(<ActivityResponsibles activityData={activity} />);

      fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la actividad.');
      expect(screen.getByText('Rosa Encargada')).toBeInTheDocument();
    });
  });
});
