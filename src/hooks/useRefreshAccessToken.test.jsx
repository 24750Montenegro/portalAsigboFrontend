import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import useRefreshAccessToken from './useRefreshAccessToken';
import SessionContext from '../context/SessionContext';
import { serverHost } from '../config';

const wrapperWith = (value) => function Wrapper({ children }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

describe('useRefreshAccessToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refresca el accessToken enviando la cookie refreshToken (credentials: include)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ accessToken: 'nuevo' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const setAccessToken = vi.fn();
    const accessTokenRef = { current: { token: null, refreshing: false } };

    const { result } = renderHook(() => useRefreshAccessToken(), {
      wrapper: wrapperWith({ setAccessToken, accessTokenRef }),
    });

    let token;
    await act(async () => { token = await result.current.refreshAccessToken(); });

    expect(token).toBe('nuevo');
    expect(setAccessToken).toHaveBeenCalledWith('nuevo');
    expect(fetchMock).toHaveBeenCalledWith(
      `${serverHost}/session/accessToken`,
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
