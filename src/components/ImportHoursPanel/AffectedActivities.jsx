import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatGuatemalaDateTime } from '@helpers/hoursImportPreview';
import styles from './ImportHoursPanel.module.css';

/** Actividades que recibieron horas o se crearon, con enlace a sus participantes. */
function AffectedActivities({ activities }) {
  if (activities.length === 0) return null;
  return (
    <section aria-labelledby="hours-affected-activities" className={styles.block}>
      <h3 id="hours-affected-activities" className={styles.sectionTitle}>Actividades afectadas</h3>
      <ul className={styles.list}>
        {activities.map((activity) => (
          <li key={activity.id}>
            <Link to={`/actividad/${activity.id}/participantes`}>{activity.name}</Link>
            {` · ${activity.areaName} · ${formatGuatemalaDateTime(activity.date)}`}
            {activity.created && ' · creada por esta carga'}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default AffectedActivities;

AffectedActivities.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    areaName: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    created: PropTypes.bool.isRequired,
  })).isRequired,
};
