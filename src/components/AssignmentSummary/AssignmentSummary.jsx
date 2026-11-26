import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { NavLink } from 'react-router-dom';
import DataField from '../DataField';
import CheckIcon from '../../assets/icons/CheckIcon';
import EnrolledIcon from '../../assets/icons/EnrolledIcon';
import { adjustmentLabel, effectiveServiceHours, hoursLabel } from '../../helpers/serviceHours';
import styles from './AssignmentSummary.module.css';

function AssignmentSummary({
  activityId, activity, completed, aditionalServiceHours,
}) {
  const baseHours = activity.serviceHours ?? 0;

  return (
    <div className={styles.assignmentSummary}>
      <h3 className={styles.sectionTitle}>Datos de la actividad</h3>

      <div className={styles.dataContainer}>
        <DataField label="Nombre de la actividad">
          <NavLink className={styles.activityLink} to={`/actividad/${activityId}`}>
            {activity.name}
          </NavLink>
        </DataField>

        <DataField label="Eje de ASIGBO">{activity.asigboArea?.name}</DataField>

        <DataField label="Fecha de realización">
          {dayjs(activity.date).format('DD/MM/YYYY')}
        </DataField>

        <DataField label="Estado de la asignación">
          <span className={`${styles.status} ${completed ? styles.completed : styles.assigned}`}>
            {completed
              ? <CheckIcon className={styles.statusIcon} />
              : <EnrolledIcon className={styles.statusIcon} />}
            {completed ? 'Completado' : 'Asignado'}
          </span>
        </DataField>
      </div>

      <h3 className={styles.sectionTitle}>Horas de servicio</h3>

      <div className={`${styles.dataContainer} ${styles.hoursContainer}`}>
        <DataField label="Horas de la actividad">{hoursLabel(baseHours)}</DataField>
        <DataField label="Horas adicionales">{adjustmentLabel(aditionalServiceHours)}</DataField>
        <DataField label="Total asignado">
          <b>{hoursLabel(effectiveServiceHours(baseHours, aditionalServiceHours))}</b>
        </DataField>
      </div>
    </div>
  );
}

export default AssignmentSummary;

AssignmentSummary.propTypes = {
  activityId: PropTypes.string.isRequired,
  activity: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    serviceHours: PropTypes.number,
    asigboArea: PropTypes.shape({ name: PropTypes.string }),
  }).isRequired,
  completed: PropTypes.bool,
  aditionalServiceHours: PropTypes.number,
};

AssignmentSummary.defaultProps = {
  completed: false,
  aditionalServiceHours: 0,
};
