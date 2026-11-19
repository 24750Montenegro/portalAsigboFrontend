import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Pagination } from '@mui/material';
import { withStudentIdHeader } from '@helpers/studentIdColumn';
import useShowStudentIdColumn from '@hooks/useShowStudentIdColumn';
import useActivityParticipants from '@hooks/useActivityParticipants';
import RefreshButton from '@components/RefreshButton';
import styles from './ActivityParticipantsTable.module.css';
import Table from '../Table/Table';
import TableRow from '../TableRow/TableRow';
import UserPicture from '../UserPicture/UserPicture';
import UserNameLink from '../UserNameLink/UserNameLink';

/**
 * Participantes de una actividad, de solo lectura (para quien no la gestiona). Usa
 * `useActivityParticipants`, igual que la tabla de gestión: su `refetch` recarga la página actual.
 */
function ActivityParticipantsTable({ idActivity }) {
  const {
    participants, total, pages, resultsPerPage, loading, error, page, setPage, refetch,
  } = useActivityParticipants(idActivity);

  const [paginationItems, setPaginationItems] = useState();

  useEffect(() => {
    // Menos páginas visibles en pantallas pequeñas.
    const media = matchMedia('(max-width:700px)');
    const handleMediaChange = (e) => setPaginationItems(e.matches ? 0 : 2);
    media.onchange = handleMediaChange;
    handleMediaChange(media);
  }, []);

  const users = participants.map((assignment) => assignment.user);
  const showStudentId = useShowStudentIdColumn(users);

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.counter}>
          {`${total} ${total === 1 ? 'participante' : 'participantes'}`}
        </p>
        <RefreshButton onClick={refetch} loading={loading} />
      </div>
      {error && <p role="alert" className={styles.error}>{error.message}</p>}
      <Table
        header={withStudentIdHeader(['No.', '', 'Nombre', 'Promoción'], showStudentId)}
        loading={loading}
        breakPoint="1100px"
        showCheckbox={false}
        showNoResults={Boolean(error) || (!loading && users.length === 0)}
      >
        {users.map((user, index) => (
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
          </TableRow>
        ))}
      </Table>

      <Pagination
        count={pages}
        siblingCount={paginationItems}
        className={styles.pagination}
        onChange={(e, newPage) => setPage(newPage - 1)}
        page={page + 1}
      />
    </>
  );
}

export default ActivityParticipantsTable;

ActivityParticipantsTable.propTypes = {
  idActivity: PropTypes.string.isRequired,
};

ActivityParticipantsTable.defaultProps = {};
