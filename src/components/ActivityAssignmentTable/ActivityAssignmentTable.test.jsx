import React from 'react';
import { screen } from '@testing-library/react';
import { mockFetch, renderWithApp, stubMatchMedia } from '@/test/renderWithApp';
import ActivityAssignmentTable from './ActivityAssignmentTable';

const assignments = {
  pages: 1,
  result: [{
    id: 'as1',
    completed: true,
    aditionalServiceHours: -6,
    activity: {
      id: 'act1',
      name: 'Reforestación',
      serviceHours: 4,
      date: '2026-10-01T12:00:00.000Z',
      asigboArea: { id: 'area1', name: 'Ambiente' },
    },
  }],
};

beforeEach(() => {
  stubMatchMedia();
  mockFetch((url) => (url.pathname.endsWith('/activity/assignment/') ? { body: assignments } : undefined));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ActivityAssignmentTable', () => {
  it('con getDetailUrl agrega el acceso al detalle de cada asignación', async () => {
    renderWithApp(
      <ActivityAssignmentTable id="u1" getDetailUrl={(a) => `/actividad/${a.activity.id}/mi-asignacion`} />,
    );

    const link = await screen.findByRole('link', { name: 'Ver detalle de Reforestación' });
    expect(link).toHaveAttribute('href', '/actividad/act1/mi-asignacion');
    expect(screen.getByText('Detalle')).toBeInTheDocument();
  });

  it('sin getDetailUrl no muestra la columna de detalle', async () => {
    renderWithApp(<ActivityAssignmentTable id="u1" />);

    await screen.findByText('Reforestación');
    expect(screen.queryByText('Detalle')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver detalle/ })).not.toBeInTheDocument();
  });

  it('las horas efectivas nunca son negativas', async () => {
    renderWithApp(<ActivityAssignmentTable id="u1" />);

    const row = (await screen.findByText('Reforestación')).closest('tr');
    expect(row.children[1]).toHaveTextContent(/^0$/);
  });
});
