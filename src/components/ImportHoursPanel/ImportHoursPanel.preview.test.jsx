import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  render, screen, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SessionContext from '@/context/SessionContext';
import useFetch from '@hooks/useFetch';
import ImportHoursPanel from './ImportHoursPanel';

vi.mock('@hooks/useFetch', () => ({ default: vi.fn() }));

const idle = {
  callFetch: vi.fn(), result: null, loading: false, error: null,
};

/** El panel llama a useFetch tres veces por render: plantilla, vista previa y confirmación. */
const mockFetches = ({ preview = null, applied = null }) => {
  let call = 0;
  useFetch.mockImplementation(() => {
    const index = call % 3;
    call += 1;
    if (index === 1) return { ...idle, result: preview };
    if (index === 2) return { ...idle, result: applied };
    return idle;
  });
};

const row = (over) => ({
  row: 2,
  carnet: '22001',
  studentName: 'Ana López',
  activityName: 'Fix',
  areaName: 'Difunde',
  date: '2026-05-09T06:00:00.000Z',
  day: '2026-05-09',
  hours: 3,
  status: 'crea_actividad',
  activityId: null,
  ...over,
});

const basePreview = {
  dryRun: true,
  applied: false,
  bulkImportId: null,
  previousImportId: null,
  activitiesCreated: 1,
  activitiesReused: 0,
  assignmentsCreated: 1,
  assignmentsCompleted: 0,
  skipped: 0,
  hoursAdded: 3,
  preview: [{ carnet: '22001', added: 3 }],
  errors: [],
  rows: [row()],
  activitiesToCreate: [{
    id: null, name: 'Fix', areaId: 'a1', areaName: 'Difunde', date: '2026-05-09T06:00:00.000Z', day: '2026-05-09', serviceHours: 0, assignments: 1,
  }],
  warnings: [],
  activities: [],
};

const renderPanel = () => render(
  <SessionContext.Provider value={{ accessToken: 'token', setAccessToken: () => {}, accessTokenRef: { current: 'token' } }}>
    <MemoryRouter>
      <ImportHoursPanel mode="multi" />
    </MemoryRouter>
  </SessionContext.Provider>,
);

describe('ImportHoursPanel — vista previa fila por fila', () => {
  it('muestra cada fila con carné, becado, actividad, eje, fecha, horas y resultado', () => {
    mockFetches({
      preview: {
        ...basePreview,
        rows: [
          row(),
          row({
            row: 3, carnet: '22002', studentName: 'Luis Pérez', status: 'ya_existia', activityId: 'x1',
          }),
        ],
      },
    });

    renderPanel();

    const table = screen.getByRole('table', { name: /vista previa por fila/i });
    const [, first, second] = within(table).getAllByRole('row');
    ['22001', 'Ana López', 'Fix', 'Difunde', '09/05/2026 00:00', '3', 'Crea actividad'].forEach((text) => {
      expect(within(first).getByText(text)).toBeInTheDocument();
    });
    expect(within(second).getByText('Luis Pérez')).toBeInTheDocument();
    expect(within(second).getByText('Ya existía (no suma)')).toBeInTheDocument();
  });

  it('pagina la tabla de 50 en 50', async () => {
    const rows = Array.from({ length: 120 }, (_, i) => (
      row({ row: i + 2, carnet: String(30000 + i) })
    ));
    mockFetches({ preview: { ...basePreview, rows } });

    renderPanel();

    const table = screen.getByRole('table', { name: /vista previa por fila/i });
    expect(within(table).getAllByRole('row')).toHaveLength(51);
    expect(screen.getByText('Filas 1–50 de 120')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    expect(screen.getByText('Filas 51–100 de 120')).toBeInTheDocument();
    expect(within(table).getByText('30050')).toBeInTheDocument();
  });
});

describe('ImportHoursPanel — actividades que se van a crear', () => {
  it('las lista con nombre, eje, fecha, horas base y asignaciones', () => {
    mockFetches({ preview: basePreview });

    renderPanel();

    const section = screen.getByRole('region', { name: /actividades que se van a crear/i });
    expect(within(section).getByText('Fix')).toBeInTheDocument();
    expect(within(section).getByText(/Difunde/)).toBeInTheDocument();
    expect(within(section).getByText(/09\/05\/2026 00:00/)).toBeInTheDocument();
    expect(within(section).getByText(/0 horas base/)).toBeInTheDocument();
    expect(within(section).getByText(/1 asignación/)).toBeInTheDocument();
  });

  it('no aparece si no se crea ninguna actividad', () => {
    mockFetches({ preview: { ...basePreview, activitiesToCreate: [] } });

    renderPanel();

    expect(screen.queryByRole('region', { name: /actividades que se van a crear/i })).not.toBeInTheDocument();
  });
});

describe('ImportHoursPanel — avisos de posible duplicado', () => {
  const warning = {
    kind: 'misma_actividad_otra_fecha',
    activityName: 'Fix',
    areaName: 'Difunde',
    day: '2026-05-09',
    rows: [2, 3],
    existing: [{
      id: 'act1', name: 'Fix', date: '2026-05-08T14:00:00.000Z', day: '2026-05-08',
    }],
  };

  it('avisa antes del botón de confirmar, con las fechas existentes enlazadas, y no bloquea', () => {
    mockFetches({ preview: { ...basePreview, warnings: [warning] } });

    renderPanel();

    const section = screen.getByRole('region', { name: /posibles actividades duplicadas/i });
    expect(within(section).getByText(/ya existe «Fix» en Difunde/i)).toBeInTheDocument();
    expect(within(section).getByText(/filas 2, 3/i)).toBeInTheDocument();
    expect(within(section).getByRole('link', { name: '08/05/2026 08:00' })).toHaveAttribute('href', '/actividad/act1/participantes');

    const confirm = screen.getByRole('button', { name: /confirmar y guardar horas/i });
    // eslint-disable-next-line no-bitwise
    expect(section.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    expect(confirm).toBeEnabled();
  });

  it('un nombre parecido el mismo día también avisa', () => {
    mockFetches({
      preview: { ...basePreview, warnings: [{ ...warning, kind: 'nombre_parecido', activityName: 'Fxi' }] },
    });

    renderPanel();

    const section = screen.getByRole('region', { name: /posibles actividades duplicadas/i });
    expect(within(section).getByText(/«Fxi» se parece a una actividad que ya existe ese día en Difunde/i)).toBeInTheDocument();
  });
});

describe('ImportHoursPanel — al confirmar', () => {
  it('lista las actividades afectadas con enlace a sus participantes', () => {
    mockFetches({
      preview: basePreview,
      applied: {
        ...basePreview,
        dryRun: false,
        applied: true,
        activities: [
          {
            id: 'act1', name: 'Fix', areaName: 'Difunde', date: '2026-05-08T14:00:00.000Z', created: false,
          },
          {
            id: 'act2', name: 'Siembra', areaName: 'Difunde', date: '2026-05-10T15:00:00.000Z', created: true,
          },
        ],
      },
    });

    renderPanel();

    const section = screen.getByRole('region', { name: /actividades afectadas/i });
    expect(within(section).getByRole('link', { name: 'Fix' })).toHaveAttribute('href', '/actividad/act1/participantes');
    expect(within(section).getByRole('link', { name: 'Siembra' })).toHaveAttribute('href', '/actividad/act2/participantes');
    expect(within(section).getByText(/creada/i)).toBeInTheDocument();
  });
});
