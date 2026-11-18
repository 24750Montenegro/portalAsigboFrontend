import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Pagination } from '@mui/material';
import {
  FaUserTimes as RemoveUserIcon,
  FaClipboardList as ListIcon,
} from 'react-icons/fa';
import { AiFillCheckCircle as CheckIcon, AiFillCloseCircle as RemoveIcon } from 'react-icons/ai';

import { useNavigate } from 'react-router-dom';
import { hasStudentIds, withStudentIdHeader } from '@helpers/studentIdColumn';
import useActivityParticipants from '@hooks/useActivityParticipants';
import AddUsersPopUp from '@components/AddUsersPopUp';
import Button from '@components/Button';
import styles from './SelectActivityParticipantsTable.module.css';
import ActivityParticipantsTableFilter from '../ActivityParticipantsTableFilter/ActivityParticipantsTableFilter';
import Table from '../Table/Table';
import useFetch from '../../hooks/useFetch';
import useToken from '../../hooks/useToken';
import { serverHost } from '../../config';
import TableRow from '../TableRow/TableRow';
import UserPicture from '../UserPicture/UserPicture';
import UserNameLink from '../UserNameLink/UserNameLink';
import OptionsButton from '../OptionsButton/OptionsButton';
import LoadingView from '../LoadingView/LoadingView';
import ConfirmationPopUp from '../ConfirmationPopUp/ConfirmationPopUp';
import SuccessNotificationPopUp from '../SuccessNotificationPopUp/SuccessNotificationPopUp';
import ErrorNotificationPopUp from '../ErrorNotificationPopUp/ErrorNotificationPopUp';
import usePopUp from '../../hooks/usePopUp';
import useCount from '../../hooks/useCount';

const actions = {
  assignMany: 'asignar varios',
  unassign: 'desasignar',
  complete: 'completar',
  uncomplete: 'no completar',
};

const successText = {
  [actions.assignMany]: 'Los becados seleccionados han sido asignados de forma exitosa.',
  [actions.unassign]: 'El usuario ha sido desasignado de forma exitosa.',
  [actions.complete]: 'La asignación del usuario a esta actividad ha sido marcada como completada.',
  [actions.uncomplete]: 'La asignación del usuario a esta actividad ha sido marcada como no completada.',
};

/** Estado real de una asignación (coincide con los valores del filtro de estado). */
const statusLabel = (assignment) => (assignment.completed ? 'Completado' : 'Asignado');

/**
 * Participantes de una actividad para quien la gestiona: solo los asignados, con su estado, y un
 * botón aparte para agregar varios a la vez. Los datos vienen de `useActivityParticipants`, cuyo
 * `refetch` recarga la página actual conservando filtros.
 */
function SelectActivityParticipantsTable({ idActivity }) {
  const {
    participants,
    total,
    pages,
    resultsPerPage,
    loading,
    error,
    setFilters,
    page,
    setPage,
    refetch,
  } = useActivityParticipants(idActivity);

  const {
    callFetch: fetchAssignmentAction,
    result: assignmentActionResult,
    loading: assignmentActionLoading,
    error: assignmentActionError,
  } = useFetch();

  const token = useToken();

  const [paginationItems, setPaginationItems] = useState();
  // Establece la acción para una asignación que se está realizando
  const [currentAction, setCurrentAction] = useState();
  // Usuario con el que se ejecuta la acción
  const [currentUser, setCurrentUser] = useState(null);

  const [isConfirmationOpen, openConfirmation, closeConfirmation] = usePopUp();
  const [isSuccessOpen, openSuccess, closeSuccess] = usePopUp();
  const [isErrorOpen, openError, closeError] = usePopUp();
  const [isAddOpen, openAdd, closeAdd] = usePopUp();

  /* Contador (utilizado como trigger) para resetear altura de tabla cuando el
  último menú desaparece */
  const { count: resetTableHeightTrigger, next: fireTableHeightTrigger } = useCount();

  /* Indica si la tabla posee el estilo vertical */
  const [tableVerticalStyle, setTableVerticalStyle] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // cambiar número en la paginación
    // Esta acción tiene fines estéticos para el número de items a mostrar
    const media = matchMedia('(max-width:700px)');

    const handleMediaChange = (e) => {
      if (e.matches) setPaginationItems(0);
      else setPaginationItems(2);
    };

    media.onchange = handleMediaChange;
    handleMediaChange(media);
  }, []);

  useEffect(() => {
    if (!assignmentActionResult) return;
    // Se culminó exitosamente una acción: recargar la página actual con los mismos filtros.
    if (currentAction === actions.assignMany) closeAdd();
    refetch();
    openSuccess();
  }, [assignmentActionResult]);

  useEffect(() => {
    if (assignmentActionError) openError(); // Ocurrió un error con una acción
  }, [assignmentActionError]);

  const handlePageChange = (e, newPage) => setPage(newPage - 1);

  const completeClickController = (user) => {
    setCurrentAction(actions.complete);
    setCurrentUser(user);
    fetchAssignmentAction({
      uri: `${serverHost}/activity/${idActivity}/assignment/${user.id}`,
      method: 'PATCH',
      headers: { authorization: token },
      parse: false,
      body: JSON.stringify({ completed: true }),
    });
  };

  // Desasignar y «no completar» piden confirmación; el fetch va en el callback del popUp.
  const unassignClickController = (user) => {
    setCurrentAction(actions.unassign);
    setCurrentUser(user);
    openConfirmation();
  };
  const uncompleteClickController = (user) => {
    setCurrentAction(actions.uncomplete);
    setCurrentUser(user);
    openConfirmation();
  };

  const handleConfirmationChange = (value) => {
    if (!value || !currentUser) return;

    const request = {
      uri: `${serverHost}/activity/${idActivity}/assignment/${currentUser.id}`,
      headers: { authorization: token },
      parse: false,
    };

    if (currentAction === actions.unassign) {
      request.method = 'DELETE';
    } else if (currentAction === actions.uncomplete) {
      request.method = 'PATCH';
      request.body = JSON.stringify({ completed: false });
    } else return;

    fetchAssignmentAction(request);
  };

  const handleAddParticipants = (idUsers) => {
    setCurrentAction(actions.assignMany);
    fetchAssignmentAction({
      uri: `${serverHost}/activity/${idActivity}/assignment/bulk`,
      method: 'POST',
      headers: { authorization: token },
      parse: false,
      body: JSON.stringify({ idUsers }),
    });
  };

  /**
   * Callback para cuando el estado de visibilidad de los menus de acciones cambia.
   * Busca resetear el alto de la tabla.
   */
  const handleActionMenuVisibilityChange = (isVisible) => {
    if (!isVisible) fireTableHeightTrigger();
  };

  const handleTableStyleChange = (isVertical) => setTableVerticalStyle(isVertical);

  const rowOptions = (assignment) => {
    const { user } = assignment;
    const details = {
      icon: <ListIcon />,
      text: 'Ver detalles',
      onClick: () => navigate(`/actividad/${idActivity}/asignacion/${user.id}`),
    };
    if (assignment.completed) {
      return [details, { icon: <RemoveIcon />, text: 'No completar', onClick: () => uncompleteClickController(user) }];
    }
    return [
      details,
      { icon: <CheckIcon />, text: 'Completar', onClick: () => completeClickController(user) },
      { icon: <RemoveUserIcon />, text: 'Desasignar', onClick: () => unassignClickController(user) },
    ];
  };

  const showStudentId = hasStudentIds(participants.map((assignment) => assignment.user));

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.counter}>
          {`${total} ${total === 1 ? 'participante' : 'participantes'}`}
        </p>
        <Button text="Agregar participantes" onClick={openAdd} />
      </div>

      <ActivityParticipantsTableFilter onChange={setFilters} />

      <Table
        header={withStudentIdHeader(['No.', '', 'Nombre', 'Promoción', 'Estado', ''], showStudentId)}
        loading={loading}
        showNoResults={Boolean(error) || (!loading && participants.length === 0)}
        resetTableHeight={resetTableHeightTrigger}
        breakPoint="1100px"
        onTableStyleChange={handleTableStyleChange}
        showCheckbox={false}
      >
        {participants.map((assignment, index) => {
          const { user } = assignment;
          return (
            <TableRow id={user.id} key={user.id}>
              <td>{resultsPerPage * page + index + 1}</td>
              <td className={styles.pictureRow}>
                <UserPicture name={user.name} idUser={user.id} hasImage={user.hasImage ?? false} />
              </td>
              <td className={styles.nameRow}>
                <UserNameLink idUser={user.id} name={`${user.name} ${user.lastname}`} />
              </td>
              {showStudentId ? <td className={styles.promotionRow}>{user.studentId ?? '—'}</td> : []}
              <td className={styles.promotionRow}>{user.promotion}</td>
              <td className={styles.statusRow}>{statusLabel(assignment)}</td>
              <td className={styles.buttonRow}>
                <OptionsButton
                  onMenuVisibleChange={handleActionMenuVisibilityChange}
                  showMenuAtTop={
                    // En estilo vertical siempre se muestra arriba
                    // O las últimas 2 filas cuando hay al menos 3 en total
                    tableVerticalStyle || (index > participants.length - 3 && index >= 2)
                  }
                  className={styles.optionsButton}
                  options={rowOptions(assignment)}
                />
              </td>
            </TableRow>
          );
        })}
      </Table>

      <Pagination
        count={pages}
        siblingCount={paginationItems}
        className={styles.pagination}
        onChange={handlePageChange}
        page={page + 1}
      />

      {assignmentActionLoading && currentAction !== actions.assignMany && <LoadingView />}

      <AddUsersPopUp
        isOpen={isAddOpen}
        close={closeAdd}
        title="Agregar participantes"
        actionText="Asignar"
        extraParams={{ excludeAssignedTo: idActivity }}
        onConfirm={handleAddParticipants}
        loading={assignmentActionLoading && currentAction === actions.assignMany}
      />

      <ConfirmationPopUp
        close={closeConfirmation}
        isOpen={isConfirmationOpen}
        callback={handleConfirmationChange}
        body={
          currentAction === actions.unassign
            ? '¿Estás seguro de desasignar a este usuario de la actividad?'
            : '¿Estás seguro de remover el estado de completado para la asignación de este usuario?'
        }
      />

      <SuccessNotificationPopUp
        isOpen={isSuccessOpen}
        close={closeSuccess}
        text={successText[currentAction] ?? 'Operación exitosa.'}
      />
      <ErrorNotificationPopUp
        isOpen={isErrorOpen}
        close={closeError}
        text={assignmentActionError?.message}
      />
    </>
  );
}

export default SelectActivityParticipantsTable;

SelectActivityParticipantsTable.propTypes = {
  idActivity: PropTypes.string.isRequired,
};

SelectActivityParticipantsTable.defaultProps = {};
