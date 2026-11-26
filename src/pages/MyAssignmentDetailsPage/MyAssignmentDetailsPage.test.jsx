import React from 'react';
import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SessionContext from '@/context/SessionContext';
import { fakeToken } from '@/test/renderWithApp';
import MyAssignmentDetailsPage from './MyAssignmentDetailsPage';

const holderToken = fakeToken({ id: 'holder1', role: ['scolarshipHolder'] });

const baseAssignment = {
  user: { id: 'holder1', name: 'Ana', lastname: 'López' },
  activity: {
    id: 'a1',
    name: 'Reforestación',
    asigboArea: { name: 'Ambiente' },
    date: '2026-10-01T12:00:00.000Z',
    serviceHours: 4,
  },
  completed: true,
  aditionalServiceHours: 2,
  notes: 'Llevó herramientas propias.',
  notesVisibleToUser: false,
  files: ['111-foto.png', '222-acta.pdf'],
};

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});

let assignmentReply;
let fetchMock;

const renderPage = (path = '/actividad/a1/mi-asignacion') => render(
  <SessionContext.Provider value={{
    accessToken: holderToken,
    setAccessToken: vi.fn(),
    accessTokenRef: { current: { token: holderToken, refreshing: false } },
  }}
  >
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/actividad/:activityId/mi-asignacion" element={<MyAssignmentDetailsPage />} />
      </Routes>
    </MemoryRouter>
  </SessionContext.Provider>,
);

const fieldValue = (label) => screen.getByText(label).nextSibling;
const rowFor = (name) => screen.getByText(name).closest('tr');

beforeEach(() => {
  assignmentReply = () => jsonResponse(baseAssignment);
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, onchange: null })));
  fetchMock = vi.fn(async (uri) => {
    if (uri.includes('/image/assignment/')) {
      const type = uri.endsWith('.pdf') ? 'application/pdf' : 'image/png';
      return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': type } });
    }
    return assignmentReply();
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('MyAssignmentDetailsPage', () => {
  it('pide la asignación del usuario en sesión, no la de un id ajeno', async () => {
    renderPage();
    await screen.findByText('Reforestación');

    const [uri, options] = fetchMock.mock.calls[0];
    expect(uri).toMatch(/\/activity\/a1\/assignment\/holder1$/);
    expect(options.headers.authorization).toBe(holderToken);
  });

  it('muestra datos de la actividad, estado y horas con las adicionales', async () => {
    renderPage();
    await screen.findByText('Reforestación');

    expect(fieldValue('Eje de ASIGBO')).toHaveTextContent('Ambiente');
    expect(fieldValue('Fecha de realización')).toHaveTextContent('01/10/2026');
    expect(fieldValue('Estado de la asignación')).toHaveTextContent('Completado');
    expect(fieldValue('Horas de la actividad')).toHaveTextContent('4 horas');
    expect(fieldValue('Horas adicionales')).toHaveTextContent('+2 horas');
    expect(fieldValue('Total asignado')).toHaveTextContent('6 horas');
  });

  it('muestra "Asignado" cuando la asignación no está completada', async () => {
    assignmentReply = () => jsonResponse({ ...baseAssignment, completed: false });
    renderPage();
    await screen.findByText('Reforestación');

    expect(fieldValue('Estado de la asignación')).toHaveTextContent('Asignado');
  });

  it('oculta las notas si el admin no las marcó como visibles', async () => {
    renderPage();
    await screen.findByText('Reforestación');

    expect(screen.queryByText('Notas de la asignación')).not.toBeInTheDocument();
    expect(screen.queryByText('Llevó herramientas propias.')).not.toBeInTheDocument();
  });

  it('muestra las notas cuando el admin las marcó como visibles', async () => {
    assignmentReply = () => jsonResponse({ ...baseAssignment, notesVisibleToUser: true });
    renderPage();

    expect(await screen.findByText('Llevó herramientas propias.')).toBeInTheDocument();
    expect(screen.getByText('Notas de la asignación')).toBeInTheDocument();
  });

  it('lista la evidencia con vista previa y descarga, sin opción de eliminar', async () => {
    renderPage();
    await screen.findByText('111-foto.png');

    const row = rowFor('222-acta.pdf');
    expect(within(row).getByRole('button', { name: 'Ver 222-acta.pdf' })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Descargar 222-acta.pdf' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('la vista previa de una imagen la carga con el token de sesión', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('111-foto.png');

    await user.click(screen.getByRole('button', { name: 'Ver 111-foto.png' }));

    expect(await screen.findByAltText('Vista previa de 111-foto.png')).toHaveAttribute('src', 'blob:preview');
    const fileCall = fetchMock.mock.calls.find(([uri]) => uri.includes('/image/assignment/111-foto.png'));
    expect(fileCall[1].headers.authorization).toBe(holderToken);
  });

  it('la vista previa de un PDF lo muestra embebido', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('222-acta.pdf');

    await user.click(screen.getByRole('button', { name: 'Ver 222-acta.pdf' }));

    expect(await screen.findByTitle('Vista previa de 222-acta.pdf')).toHaveAttribute('src', 'blob:preview');
    expect(screen.getByRole('link', { name: 'Abrir en otra pestaña' })).toBeInTheDocument();
  });

  it('descargar guarda el archivo con su nombre', async () => {
    const user = userEvent.setup();
    const downloads = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function captureDownload() {
      downloads.push(this.download);
    });
    renderPage();
    await screen.findByText('111-foto.png');

    await user.click(screen.getByRole('button', { name: 'Descargar 111-foto.png' }));

    await waitFor(() => expect(downloads).toEqual(['111-foto.png']));
  });

  it('si la descarga falla lo explica en pantalla', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (uri) => (
      uri.includes('/image/assignment/') ? new Response('', { status: 403 }) : assignmentReply()
    ));
    renderPage();
    await screen.findByText('111-foto.png');

    await user.click(screen.getByRole('button', { name: 'Descargar 111-foto.png' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo descargar "111-foto.png"');
  });

  it('indica cuando no hay evidencia adjunta', async () => {
    assignmentReply = () => jsonResponse({ ...baseAssignment, files: [] });
    renderPage();

    expect(await screen.findByText('No se adjuntaron archivos de evidencia.')).toBeInTheDocument();
  });

  it('si el becado no tiene asignación en la actividad muestra "no encontrada"', async () => {
    assignmentReply = () => jsonResponse({ err: 'No encontrado' }, 404);
    renderPage();

    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument();
  });
});
