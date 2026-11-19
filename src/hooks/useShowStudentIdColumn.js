import useSessionData from './useSessionData';
import { showStudentIdColumn } from '../helpers/studentIdColumn';

/** Decide si las tablas de usuarios muestran la columna «Carné», según el rol en sesión. */
function useShowStudentIdColumn(users) {
  const session = useSessionData();
  return showStudentIdColumn(users, session?.role);
}

export default useShowStudentIdColumn;
