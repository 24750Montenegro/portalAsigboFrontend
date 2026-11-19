import React from 'react';
import PropTypes from 'prop-types';
import styles from './ActivityResponsiblesTable.module.css';
import UserTable from '../UserTable';

/** Tabla de encargados: recibe la lista ya cargada (ver `useActivityResponsibles`). */
function ActivityResponsiblesTable({ responsibles, loading }) {
  return (
    <UserTable
      users={responsibles.map((value) => ({
        id: value.id,
        name: value.name,
        lastname: value.lastname,
        promotion: value.promotion,
        hasImage: value.hasImage,
        studentId: value.studentId,
      }))}
      loading={loading}
      noResults={!loading && responsibles.length === 0}
      className={styles.table}
    />
  );
}

ActivityResponsiblesTable.propTypes = {
  responsibles: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    lastname: PropTypes.string,
    promotion: PropTypes.number,
  })),
  loading: PropTypes.bool,
};

ActivityResponsiblesTable.defaultProps = {
  responsibles: [],
  loading: false,
};

export default ActivityResponsiblesTable;
