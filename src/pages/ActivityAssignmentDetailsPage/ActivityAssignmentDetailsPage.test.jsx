import React from 'react';
import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import SessionContext from '../../context/SessionContext';
import ActivityAssignmentDetailsPage from './ActivityAssignmentDetailsPage';

const assignment = {
  user: {
    id: 'u1', name: 'Ana', lastname: 'López', promotion: 2022, hasImage: false,
  },
  activity: {
    name: 'Reforestación', asigboArea: { name: 'Ambiente' }, date: '2026-10-01T00:00:00.000Z', serviceHours: 4,
  },
  completed: false,
  aditionalServiceHours: 0,
  notes: '',
  files: ['111-foto.png'],
};

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});

// JWT con forma válida (header.payload.firma): algunos componentes leen el payload de la sesión.
const fakeToken = `x.${btoa(JSON.stringify({ id: 'admin', role: ['admin'] }))}.y`;

/** `patchReply` decide qué responde el PATCH; el GET siempre devuelve `assignment`. */
let patchReply;
let patchBodies;

const file = (name, type, size = 10) => new File([new Uint8Array(size)], name, { type });

const renderPage = () => render(
  <SessionContext.Provider value={{
    accessToken: fakeToken, setAccessToken: vi.fn(), accessTokenRef: { current: {} },
  }}
  >
    <MemoryRouter initialEntries={['/actividad/a1/asignacion/u1']}>
      <Routes>
        <Route path="/actividad/:activityId/asignacion/:userId" element={<ActivityAssignmentDetailsPage />} />
      </Routes>
    </MemoryRouter>
  </SessionContext.Provider>,
);

const fileInput = (container) => container.querySelector('input[type="file"]');
const rowFor = (name) => screen.getByText(name).closest('tr');

beforeEach(() => {
  patchBodies = [];
  patchReply = () => jsonResponse({ filesSaved: [] });
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  // jsdom no implementa matchMedia; Table/BackTitle lo usan para el breakpoint.
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  vi.stubGlobal('fetch', vi.fn(async (uri, options = {}) => {
    if (options.method === 'PATCH') {
      patchBodies.push(options.body);
      return patchReply(options.body);
    }
    return jsonResponse(assignment);
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ActivityAssignmentDetailsPage — archivos', () => {
  it('muestra los límites de tipo, tamaño y cantidad', async () => {
    renderPage();

    expect(await screen.findByText(/Imágenes \(JPEG, PNG, WEBP\) o PDF/)).toBeInTheDocument();
    expect(screen.getByText(/máximo 3 MB por archivo, 5 por subida y 10 por asignación/i)).toBeInTheDocument();
  });

  it('lista los archivos existentes junto con los nuevos y "Eliminar" en uno nuevo quita solo ese', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findByText('111-foto.png');

    await user.upload(fileInput(container), [file('acta.pdf', 'application/pdf'), file('otra.png', 'image/png')]);

    expect(screen.getByText('111-foto.png')).toBeInTheDocument();
    expect(screen.getByText('acta.pdf')).toBeInTheDocument();
    expect(screen.getByText('otra.png')).toBeInTheDocument();

    await user.click(within(rowFor('acta.pdf')).getByRole('button', { name: 'Eliminar' }));

    expect(screen.queryByText('acta.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('111-foto.png')).toBeInTheDocument();
    expect(screen.getByText('otra.png')).toBeInTheDocument();
  });

  it('al aplicar envía solo los archivos nuevos y en filesToRemove solo el existente eliminado', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findByText('111-foto.png');

    await user.upload(fileInput(container), file('acta.pdf', 'application/pdf'));
    await user.click(within(rowFor('111-foto.png')).getByRole('button', { name: 'Eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Aplicar cambios' }));

    await waitFor(() => expect(patchBodies).toHaveLength(1));
    const body = patchBodies[0];
    expect(body.getAll('files').map((f) => f.name)).toEqual(['acta.pdf']);
    expect(body.getAll('filesToRemove[]')).toEqual(['111-foto.png']);
  });

  it('tras guardar, la lista conserva los existentes y agrega los guardados', async () => {
    const user = userEvent.setup();
    patchReply = () => jsonResponse({ filesSaved: ['222-acta.pdf'] });
    const { container } = renderPage();
    await screen.findByText('111-foto.png');

    await user.upload(fileInput(container), file('acta.pdf', 'application/pdf'));
    await user.click(screen.getByRole('button', { name: 'Aplicar cambios' }));

    expect(await screen.findByText('222-acta.pdf')).toBeInTheDocument();
    expect(screen.getByText('111-foto.png')).toBeInTheDocument();
    expect(screen.queryByText('acta.pdf')).not.toBeInTheDocument();
  });

  it('rechaza un tipo no permitido con un mensaje que explica la causa', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = renderPage();
    await screen.findByText('111-foto.png');

    await user.upload(fileInput(container), file('notas.txt', 'text/plain'));

    expect(screen.queryByText('notas.txt')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '"notas.txt" no es de un tipo permitido. Solo se permiten imágenes (JPEG, PNG, WEBP) y PDF.',
    );
  });

  it('rechaza un archivo de más de 3 MB con un mensaje de tamaño', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findByText('111-foto.png');

    await user.upload(fileInput(container), file('grande.pdf', 'application/pdf', 3_000_001));

    expect(screen.queryByText('grande.pdf')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('"grande.pdf" supera el tamaño máximo de 3 MB.');
  });

  it('no agrega más de 5 archivos por subida y explica por qué', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findByText('111-foto.png');

    const many = Array.from({ length: 6 }, (_, i) => file(`f${i}.png`, 'image/png'));
    await user.upload(fileInput(container), many);

    expect(screen.getByText('f4.png')).toBeInTheDocument();
    expect(screen.queryByText('f5.png')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('"f5.png" no se agregó: solo se pueden subir 5 archivos a la vez.');
  });

  it('no supera 10 archivos por asignación y explica por qué', async () => {
    const user = userEvent.setup();
    const existing = Array.from({ length: 9 }, (_, i) => `${i}-x.png`);
    vi.mocked(fetch).mockImplementation(async (uri, options = {}) => (
      options.method === 'PATCH' ? jsonResponse({ filesSaved: [] }) : jsonResponse({ ...assignment, files: existing })
    ));
    const { container } = renderPage();
    await screen.findByText('0-x.png');

    await user.upload(fileInput(container), [file('a.png', 'image/png'), file('b.png', 'image/png')]);

    expect(screen.getByText('a.png')).toBeInTheDocument();
    expect(screen.queryByText('b.png')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('"b.png" no se agregó: una asignación puede tener como máximo 10 archivos.');
  });

  it('muestra en el modal el mensaje del backend en lugar del genérico', async () => {
    const user = userEvent.setup();
    patchReply = () => jsonResponse({ err: 'Una asignación puede tener como máximo 10 archivos. Ya tiene 9 y se intentaron agregar 2.', status: 400 }, 400);
    renderPage();
    await screen.findByText('111-foto.png');

    await user.click(screen.getByRole('button', { name: 'Aplicar cambios' }));

    expect(await screen.findByText('Una asignación puede tener como máximo 10 archivos. Ya tiene 9 y se intentaron agregar 2.')).toBeInTheDocument();
  });

  it('si la respuesta 413 no trae JSON (p. ej. la corta un proxy), explica que es por tamaño', async () => {
    const user = userEvent.setup();
    patchReply = () => new Response('<html>413 Request Entity Too Large</html>', { status: 413 });
    renderPage();
    await screen.findByText('111-foto.png');

    await user.click(screen.getByRole('button', { name: 'Aplicar cambios' }));

    expect(await screen.findByText(/Los archivos superan el tamaño permitido por el servidor/)).toBeInTheDocument();
  });

  it('si la petición no llega al servidor, no muestra el mensaje genérico', async () => {
    const user = userEvent.setup();
    patchReply = () => { throw new TypeError('Failed to fetch'); };
    renderPage();
    await screen.findByText('111-foto.png');

    await user.click(screen.getByRole('button', { name: 'Aplicar cambios' }));

    expect(await screen.findByText(/No se pudo completar la solicitud/)).toBeInTheDocument();
  });
});
