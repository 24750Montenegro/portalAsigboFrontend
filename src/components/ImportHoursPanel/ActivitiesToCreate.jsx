import React from 'react';
import PropTypes from 'prop-types';
import { formatGuatemalaDateTime } from '@helpers/hoursImportPreview';
import styles from './ImportHoursPanel.module.css';

/** Actividades que se crearán, para revisar posibles duplicados por errores de digitación. */
function ActivitiesToCreate({ activities }) {
  if (activities.length === 0) return null;
  return (
    <section aria-labelledby="hours-activities-to-create" className={styles.block}>
      <h3 id="hours-activities-to-create" className={styles.sectionTitle}>
        {`Actividades que se van a crear (${activities.length})`}
      </h3>
      <ul className={styles.list}>
        {activities.map((activity) => (
          <li key={`${activity.areaId}|${activity.day}|${activity.name}`}>
            <strong>{activity.name}</strong>
            {` · ${activity.areaName} · ${formatGuatemalaDateTime(activity.date)}`}
            {` · ${activity.serviceHours} horas base · ${activity.assignments} ${activity.assignments === 1 ? 'asignación' : 'asignaciones'}`}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ActivitiesToCreate;

ActivitiesToCreate.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    areaId: PropTypes.string.isRequired,
    areaName: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    day: PropTypes.string.isRequired,
    serviceHours: PropTypes.number.isRequired,
    assignments: PropTypes.number.isRequired,
  })).isRequired,
};
