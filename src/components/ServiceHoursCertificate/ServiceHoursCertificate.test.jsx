import React from 'react';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { vi } from 'vitest';
import ServiceHoursCertificate from './ServiceHoursCertificate';
import { fakeToken } from '../../test/renderWithApp';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), token: '' }));
vi.mock('../../hooks/useApiFetch', () => ({ default: () => ({ apiFetch: mocks.apiFetch }) }));
vi.mock('../../hooks/useToken', () => ({ default: () => mocks.token }));

beforeEach(() => {
  mocks.apiFetch.mockReset();
  mocks.token = fakeToken({ id: 'holder', role: ['scolarshipHolder'] });
});

it('permite descargar el propio PDF con el rango indicado', async () => {
  mocks.apiFetch.mockResolvedValue({ blob: async () => new Blob(['pdf']) });
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<ServiceHoursCertificate userId="holder" />);
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2025-01-01' } });
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2025-12-31' } });
  fireEvent.click(screen.getByRole('button', { name: 'Descargar constancia' }));
  await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledTimes(1));
  expect(mocks.apiFetch.mock.calls[0][0].uri).toContain('from=2025-01-01&to=2025-12-31');
  await waitFor(() => expect(click).toHaveBeenCalled());
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  click.mockRestore();
});

it('avisa cuando el rango está invertido', () => {
  render(<ServiceHoursCertificate userId="holder" />);
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2025-12-31' } });
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2025-01-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Descargar constancia' }));
  expect(screen.getByRole('alert')).toHaveTextContent('La fecha inicial');
  expect(mocks.apiFetch).not.toHaveBeenCalled();
});

it('oculta la descarga para un becado distinto y la muestra al administrador', () => {
  const view = render(<ServiceHoursCertificate userId="other" />);
  expect(screen.queryByRole('button', { name: 'Descargar constancia' })).not.toBeInTheDocument();
  mocks.token = fakeToken({ id: 'admin', role: ['admin'] });
  view.rerender(<ServiceHoursCertificate userId="other" />);
  expect(screen.getByRole('button', { name: 'Descargar constancia' })).toBeInTheDocument();
});
