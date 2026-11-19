/**
 * Ayudas para la columna «Carné» de las tablas de usuarios.
 *
 * El backend solo envía `studentId` a quien puede verlo (admin, encargados y el propio
 * becado). Los roles que ven todos los carnés tienen la columna siempre, aunque la página
 * no traiga ninguno (p. ej. una promoción sin carnés cargados muestra «—» en vez de
 * esconder la columna). Para los demás roles se muestra solo si alguna fila lo trae.
 */
import consts from './consts';

/** Roles que ven el carné de todos los usuarios (igual que `canSeeStudentId` del backend). */
const rolesThatSeeAllStudentIds = [
  consts.roles.admin,
  consts.roles.asigboAreaResponsible,
  consts.roles.activityResponsible,
];

/** true si al menos un usuario de la lista trae carné. */
export const hasStudentIds = (users) => Array.isArray(users)
  && users.some((user) => typeof user?.studentId === 'string' && user.studentId !== '');

/** true si la columna «Carné» debe mostrarse para estos usuarios y roles de sesión. */
export const showStudentIdColumn = (users, roles) => (
  (Array.isArray(roles) && roles.some((role) => rolesThatSeeAllStudentIds.includes(role)))
  || hasStudentIds(users)
);

/** Inserta «Carné» después de «Nombre» (índice 3) cuando la columna se muestra. */
export const withStudentIdHeader = (header, show) => (
  show ? [...header.slice(0, 3), 'Carné', ...header.slice(3)] : header
);
