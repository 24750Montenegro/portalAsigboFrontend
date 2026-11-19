import React, { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SessionContext, { SessionProvider } from './SessionContext';
import { serverHost } from '../config';

function TokenProbe() {
  const { accessToken } = useContext(SessionContext);
  if (accessToken === undefined) return <p>cargando</p>;
  return <p>{accessToken === null ? 'sin sesión' : `token:${accessToken}`}</p>;
}

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('SessionProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pide el accessToken inicial enviando la cookie refreshToken (credentials: include)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { accessToken: 'abc' }));
    vi.stubGlobal('fetch', fetchMock);

    render(<SessionProvider><TokenProbe /></SessionProvider>);

    expect(await screen.findByText('token:abc')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${serverHost}/session/accessToken`,
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('mantiene accessToken undefined mientras la petición inicial no responde', async () => {
    let resolveFetch;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; })));

    render(<SessionProvider><TokenProbe /></SessionProvider>);

    expect(screen.getByText('cargando')).toBeInTheDocument();
    resolveFetch(jsonResponse(401, {}));
    await waitFor(() => expect(screen.getByText('sin sesión')).toBeInTheDocument());
  });
});
