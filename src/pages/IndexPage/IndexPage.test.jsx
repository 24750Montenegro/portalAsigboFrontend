import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import IndexPage from './IndexPage';
import SessionContext from '../../context/SessionContext';

/*
 * Lo que se prueba es el enrutado por sesión y rol, no el contenido de cada página:
 * las páginas se reemplazan por stubs para no arrastrar sus peticiones a la API.
 */
const { stub } = vi.hoisted(() => ({
  stub: (name) => ({ default: () => React.createElement('p', null, name) }),
}));
vi.mock('@components/PageContainer/PageContainer', () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock('@components/LoadingView/LoadingView', () => stub('cargando sesión'));
vi.mock('@pages/HomePage/HomePage', () => stub('página inicio'));
vi.mock('@pages/WorkPanelPage/WorkPanelPage', () => stub('página panel'));
vi.mock('@pages/AreaDetailsPage/AreaDetailsPage', () => stub('página detalle de área'));
vi.mock('@pages/ActivityDetailsPage/ActivityDetailsPage', () => stub('página detalle de actividad'));
vi.mock('@pages/ImportHoursPage/ImportHoursPage', () => stub('página importar horas'));
vi.mock('@pages/LoginPage/LoginPage', () => stub('página login'));

const tokenWithRoles = (role) => {
  const payload = btoa(JSON.stringify({ id: 'u1', name: 'Ana', role }));
  return `header.${payload}.firma`;
};

const renderAt = (path, accessToken) => {
  const setAccessToken = vi.fn();
  render(
    <SessionContext.Provider
      value={{ accessToken, setAccessToken, accessTokenRef: { current: {} } }}
    >
      <MemoryRouter initialEntries={[path]}>
        <IndexPage />
      </MemoryRouter>
    </SessionContext.Provider>,
  );
  return { setAccessToken };
};

describe('IndexPage: rutas internas al recargar o abrir desde un enlace', () => {
  it.each([
    ['/panel', 'página panel'],
    ['/area/652f0c0e9b1e8a0012345678', 'página detalle de área'],
    ['/actividad/652f0c0e9b1e8a0012345678/participantes', 'página detalle de actividad'],
    ['/actividad/importar-horas', 'página importar horas'],
  ])('un admin con sesión que abre %s ve su página', (path, expected) => {
    renderAt(path, tokenWithRoles(['admin']));
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    ['/panel', 'página panel'],
    ['/area/652f0c0e9b1e8a0012345678', 'página detalle de área'],
    ['/actividad/652f0c0e9b1e8a0012345678/participantes', 'página detalle de actividad'],
    ['/actividad/importar-horas', 'página importar horas'],
  ])('un encargado de área con sesión que abre %s ve su página', (path, expected) => {
    renderAt(path, tokenWithRoles(['asigboAreaResponsible']));
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('mientras la sesión se resuelve (token undefined) muestra la carga, no el login ni el 404', () => {
    renderAt('/actividad/importar-horas', undefined);
    expect(screen.getByText('cargando sesión')).toBeInTheDocument();
    expect(screen.queryByText('página login')).not.toBeInTheDocument();
    expect(screen.queryByText('Página no encontrada')).not.toBeInTheDocument();
  });

  it('sin sesión (token null) muestra el login', () => {
    renderAt('/panel', null);
    expect(screen.getByText('página login')).toBeInTheDocument();
  });

  it.each([['admin'], ['scolarshipHolder']])(
    'una ruta inexistente muestra el 404 propio sin cerrar la sesión (%s)',
    (role) => {
      const { setAccessToken } = renderAt('/no-existe/de-verdad', tokenWithRoles([role]));
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
      expect(setAccessToken).not.toHaveBeenCalled();
    },
  );
});
