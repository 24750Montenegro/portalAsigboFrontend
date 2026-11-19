import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PopUp from '@components/PopUp';
import UserSelectTable from '@components/UserSelectTable';
import Button from '@components/Button';
import Spinner from '@components/Spinner/Spinner';
import styles from './AddUsersPopUp.module.css';

/**
 * Ventana para elegir varios usuarios a la vez con la misma tabla de selección múltiple que se usa
 * al crear una actividad.
 *
 * @param extraParams Parámetros extra para el listado de usuarios, p. ej.
 *   `{ excludeAssignedTo: idActivity }` o `{ exclude: [ids] }` para no ofrecer a los ya asignados.
 * @param onConfirm Recibe el arreglo de ids seleccionados.
 */
function AddUsersPopUp({
  isOpen, close, title, actionText, extraParams, onConfirm, loading,
}) {
  const [selected, setSelected] = useState([]);

  if (!isOpen) return null;

  return (
    <PopUp close={close} maxWidth={900}>
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <UserSelectTable onChange={setSelected} extraParams={extraParams} />
        <div className={styles.actions}>
          {loading ? <Spinner /> : (
            <Button
              text={`${actionText} ${selected.length} seleccionado(s)`}
              green
              disabled={selected.length === 0}
              onClick={() => onConfirm(selected)}
            />
          )}
        </div>
      </div>
    </PopUp>
  );
}

export default AddUsersPopUp;

AddUsersPopUp.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  actionText: PropTypes.string,
  extraParams: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  ),
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

AddUsersPopUp.defaultProps = {
  actionText: 'Agregar',
  extraParams: {},
  loading: false,
};
