import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useSessionData from '@hooks/useSessionData';
import UserTable from './UserTable';

vi.mock('@hooks/useSessionData', () => ({ default: vi.fn() }));
vi.mock('../UserPicture', () => ({ default: () => null }));
vi.mock('@components/UserNameLink', () => ({ default: ({ name }) => <span>{name}</span> }));

const promo2021 = [
  { id: 'u1', name: 'Ana', promotion: 2021 },
  { id: 'u2', name: 'Luis', promotion: 2021 },
];

const renderTable = (users) => render(
  <MemoryRouter><UserTable users={users} /></MemoryRouter>,
);

describe('UserTable · columna Carné', () => {
  beforeAll(() => {
    window.matchMedia = window.matchMedia || (() => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('un admin ve la columna con «—» aunque la promoción no tenga carnés', () => {
    useSessionData.mockReturnValue({ role: ['admin'] });
    renderTable(promo2021);
    expect(screen.getAllByText('Carné').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('un becado sin carnés en la lista no ve la columna', () => {
    useSessionData.mockReturnValue({ role: ['scolarshipHolder'] });
    renderTable(promo2021);
    expect(screen.queryByText('Carné')).not.toBeInTheDocument();
  });
});
