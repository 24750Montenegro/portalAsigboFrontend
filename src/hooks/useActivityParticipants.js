import { useCallback, useEffect, useState } from 'react';
import { serverHost } from '@/config';
import useFetch from './useFetch';
import useToken from './useToken';

const emptyPage = {
  total: 0, pages: 0, resultsPerPage: 0, result: [],
};

/**
 * Participantes (asignaciones) de una actividad, paginados en el servidor.
 *
 * Solo trae a los asignados, con su total. Los filtros son `{ status, promotion, search }`, donde
 * `status` es `'pending'` (asignado sin completar) o `'completed'`. Cambiar los filtros vuelve a la
 * primera página.
 *
 * `refetch()` vuelve a pedir la página actual con los filtros actuales: úsalo tras asignar,
 * desasignar o completar, o desde un botón «Actualizar». Mientras recarga se conserva la última
 * página recibida, así la tabla no parpadea.
 *
 * @param {string} idActivity
 */
function useActivityParticipants(idActivity) {
  const token = useToken();
  const {
    callFetch, result, error, loading,
  } = useFetch();

  const [data, setData] = useState(null);
  const [filters, setFiltersState] = useState({});
  const [page, setPage] = useState(0);

  const refetch = useCallback(() => {
    if (!idActivity) return;
    const params = new URLSearchParams({ page: String(page) });
    if (filters.status) params.append('status', filters.status);
    if (filters.promotion?.trim()) params.append('promotion', filters.promotion.trim());
    if (filters.search?.trim()) params.append('search', filters.search.trim());

    callFetch({
      uri: `${serverHost}/activity/${idActivity}/assignment?${params.toString()}`,
      headers: { authorization: token },
    });
  }, [idActivity, page, filters, token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (result) setData(result);
  }, [result]);

  /** Reemplaza los filtros y vuelve a la página 0 (si no cambiaron, no hace nada). */
  const setFilters = useCallback((next) => {
    if (JSON.stringify(filters) === JSON.stringify(next)) return;
    setFiltersState(next);
    setPage(0);
  }, [filters]);

  const current = data ?? emptyPage;

  return {
    participants: current.result,
    total: current.total,
    pages: current.pages,
    resultsPerPage: current.resultsPerPage,
    loading,
    error,
    filters,
    setFilters,
    page,
    setPage,
    refetch,
  };
}

export default useActivityParticipants;
