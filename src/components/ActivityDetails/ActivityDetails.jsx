/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import styles from './ActivityDetails.module.css';
import DataField from '../DataField';
import CheckIcon from '../../assets/icons/CheckIcon';
import EnrolledIcon from '../../assets/icons/EnrolledIcon';
import consts from '../../helpers/consts';
import randomString from '../../helpers/randomString';

const hoursLabel = (hours) => `${hours} ${hours === 1 ? 'hora' : 'horas'}`;

/**
 * Horas efectivas del becado en la actividad (base + ajuste, nunca menos de 0) y el desglose
 * cuando hay ajuste. El ajuste es negativo cuando se le registraron menos horas que las base
 * (p. ej. por CSV).
 */
const serviceHoursText = (baseHours, adjustment = 0) => {
  if (!adjustment) return hoursLabel(baseHours);
  const total = hoursLabel(Math.max(0, baseHours + adjustment));
  if (adjustment > 0) {
    return `${total} (${baseHours} base + ${adjustment} ${adjustment > 1 ? 'adicionales' : 'adicional'})`;
  }
  return `${total} (${baseHours} base − ${-adjustment} de ajuste)`;
};

function ActivityDetails({ className, data }) {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (data?.userAssignment) {
      setIsEnrolled(true);
      setIsCompleted(data?.userAssignment.completed);
      return;
    }

    setIsCompleted(false);
    setIsEnrolled(false);
  }, [data]);

  return (
    <div className={`${styles.main} ${className}`}>
      <div className={styles.detailsHeader}>
        <h2 className={styles.dataHeader}>Datos de la actividad</h2>
        <div className={styles.status}>
          {isEnrolled ? (
            isCompleted ? (
              <>
                <b>COMPLETADO</b>
                <CheckIcon className={styles.statusIcon} />
              </>
            ) : (
              <>
                <b>INSCRITO</b>
                <EnrolledIcon className={styles.statusIcon} />
              </>
            )
          ) : (
            ''
          )}
        </div>
      </div>
      <div className={styles.data}>
        {data?.description?.trim().length > 0 && (
        <p className={styles.description}>
          {data?.description}
        </p>
        )}
        <DataField label="Nombre de actividad" className={styles.dataField}>
          {data ? data?.name : ''}
        </DataField>
        <DataField label="Eje de ASIGBO" className={styles.dataField}>
          {data ? data?.asigboArea.name : ''}
        </DataField>
        <DataField label="Fecha de realización" className={styles.dataField}>
          {data ? dayjs(data.date).format('DD/MM/YYYY') : ''}
        </DataField>
        <DataField label="Horas de servicio" className={styles.dataField}>
          {data ? serviceHoursText(data.serviceHours, data.userAssignment?.aditionalServiceHours) : ''}
        </DataField>

        <DataField label="Pago requerido" className={styles.dataField}>
          N/A
        </DataField>
      </div>
      <h3 className={`${styles.disponibility} ${styles.dataField}`}>Disponibilidad</h3>
      <div className={styles.disponData}>
        <DataField
          label="Espacios disponibles"
          className={`${styles.disponField} ${styles.dataField}`}
        >
          {data ? data?.availableSpaces : '0'}
        </DataField>
        <DataField
          label="Disponibilidad de inscripción"
          className={`${styles.disponField} ${styles.dataField}`}
        >
          {`De ${
            data
              ? dayjs(data.registrationStartDate).format('DD/MM/YYYY')
              : '00/00/0000'
          } hasta ${
            data
              ? dayjs(data.registrationEndDate).format('DD/MM/YYYY')
              : '00/00/0000'
          }
          `}
        </DataField>
        {data?.participatingPromotions ? (
          <>
            <span className={`${styles.promoLabel}`}>Promociones Participantes</span>
            <div className={styles.promosContainer}>
              {data?.participatingPromotions.sort((a, b) => b - a).map((promo) => (
                <span className={styles.promo} key={randomString()}>
                  {consts.promotionsGroups[promo] ? `${consts.promotionsGroups[promo]}` : promo}
                </span>
              ))}
            </div>
          </>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

ActivityDetails.propTypes = {
  className: PropTypes.string,
  data: PropTypes.instanceOf(Object),
};

ActivityDetails.defaultProps = {
  className: '',
  data: null,
};

export default ActivityDetails;
