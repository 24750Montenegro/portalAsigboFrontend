import { useCallback, useEffect, useState } from 'react';
import { serverHost } from '@/config';
import useFetch from './useFetch';
import useToken from './useToken';

/**
 * Encargados de una actividad. Arranca con los que ya trae la actividad cargada por la página (no
 * repite la petición al montar); `refetch()` vuelve a pedir la actividad y toma sus encargados
 * actuales — úsalo tras agregar encargados o desde un botón «Actualizar».
 *
 * @param {string} idActivity
 * @param {Object[]} initialResponsibles `activity.responsible`, tal como llega de
 *   `GET /activity/:id`.
 */
function useActivityResponsibles(idActivity, initialResponsibles) {
  const token = useToken();
  const {
    callFetch, result, error, loading,
  } = useFetch();
  const [responsibles, setResponsibles] = useState(initialResponsibles ?? []);

  useEffect(() => {
    setResponsibles(initialResponsibles ?? []);
  }, [initialResponsibles]);

  useEffect(() => {
    if (result?.responsible) setResponsibles(result.responsible);
  }, [result]);

  const refetch = useCallback(() => {
    if (!idActivity) return;
    callFetch({ uri: `${serverHost}/activity/${idActivity}`, headers: { authorization: token } });
  }, [idActivity, token]);

  return {
    responsibles, loading, error, refetch,
  };
}

export default useActivityResponsibles;
