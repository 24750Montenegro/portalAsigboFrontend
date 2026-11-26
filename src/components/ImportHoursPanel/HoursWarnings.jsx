import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatDay, formatGuatemalaDateTime } from '@helpers/hoursImportPreview';
import styles from './ImportHoursPanel.module.css';

const describe = (warning) => (warning.kind === 'nombre_parecido'
  ? `«${warning.activityName}» se parece a una actividad que ya existe ese día en ${warning.areaName}`
  : `Ya existe «${warning.activityName}» en ${warning.areaName} con otra fecha`);

/** Avisos de posible duplicado que no bloquean la confirmación. */
function HoursWarnings({ warnings }) {
  if (warnings.length === 0) return null;
  return (
    <section aria-labelledby="hours-warnings" className={`${styles.block} ${styles.warning}`}>
      <h3 id="hours-warnings" className={styles.sectionTitle}>Posibles actividades duplicadas</h3>
      <p className={styles.instructions}>
        Revise el nombre y la fecha: si es la misma actividad, corrija el archivo y vuelva a
        subirlo.
        Si de verdad es otra actividad, puede confirmar.
      </p>
      <ul className={styles.list}>
        {warnings.map((warning) => (
          <li key={`${warning.kind}|${warning.activityName}|${warning.day}`}>
            {`${describe(warning)} (en el archivo: ${formatDay(warning.day)}, filas ${warning.rows.join(', ')}). Existente: `}
            {warning.existing.map((activity, index) => (
              <React.Fragment key={activity.id}>
                {index > 0 && ', '}
                <Link to={`/actividad/${activity.id}/participantes`}>{formatGuatemalaDateTime(activity.date)}</Link>
                {activity.name !== warning.activityName && ` («${activity.name}»)`}
              </React.Fragment>
            ))}
            .
          </li>
        ))}
      </ul>
    </section>
  );
}

export default HoursWarnings;

HoursWarnings.propTypes = {
  warnings: PropTypes.arrayOf(PropTypes.shape({
    kind: PropTypes.oneOf(['misma_actividad_otra_fecha', 'nombre_parecido']).isRequired,
    activityName: PropTypes.string.isRequired,
    areaName: PropTypes.string.isRequired,
    day: PropTypes.string.isRequired,
    rows: PropTypes.arrayOf(PropTypes.number).isRequired,
    existing: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
    })).isRequired,
  })).isRequired,
};
