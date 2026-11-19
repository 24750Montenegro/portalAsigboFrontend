import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SessionContext from '@/context/SessionContext';

const base64url = (value) => btoa(JSON.stringify(value)).replace(/=+$/, '');

/** JWT falso (sin firma válida) de un admin: varios componentes leen el payload del token. */
export const fakeToken = (payload = {}) => [
  base64url({ alg: 'HS256', typ: 'JWT' }),
  base64url({
    id: 'admin1', name: 'Admin', lastname: 'Prueba', role: ['admin'], ...payload,
  }),
  'firma',
].join('.');

/**
 * Renderiza con sesión (token falso) y router en memoria: lo mínimo que piden useFetch y los
 * enlaces de usuario.
 */
export const renderWithApp = (ui) => render(
  <SessionContext.Provider
    value={{
      accessToken: fakeToken(),
      setAccessToken: vi.fn(),
      accessTokenRef: { current: { token: fakeToken(), refreshing: false } },
    }}
  >
    <MemoryRouter>{ui}</MemoryRouter>
  </SessionContext.Provider>,
);

const jsonReply = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

/**
 * Reemplaza `fetch` global. `handler(url, init)` devuelve `{ status?, body }` o `undefined`
 * (→ 404). Devuelve el mock para inspeccionar las llamadas.
 */
export const mockFetch = (handler) => {
  const fetchMock = vi.fn(async (uri, init = {}) => {
    const url = new URL(uri, 'http://localhost');
    const reply = await handler(url, init);
    if (!reply) return jsonReply({ err: 'No encontrado' }, 404);
    return jsonReply(reply.body ?? null, reply.status ?? 200);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

/** jsdom no implementa matchMedia; las tablas paginadas lo usan para la paginación. */
export const stubMatchMedia = () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, onchange: null })));
};

export const promotionsReply = {
  body: { notStudents: ['chick', 'graduate'], students: { id: 'student', years: [2023, 2022] } },
};
