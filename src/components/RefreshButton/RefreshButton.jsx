import React from 'react';
import PropTypes from 'prop-types';
import { FiRefreshCw as RefreshIcon } from 'react-icons/fi';
import Button from '@components/Button';
import Spinner from '@components/Spinner';
import styles from './RefreshButton.module.css';

/**
 * Botón «Actualizar» de las tablas: vuelve a cargar los datos sin salir de la pantalla. Mientras
 * `loading` queda deshabilitado y cambia el icono por un spinner.
 */
function RefreshButton({ onClick, loading, className }) {
  return (
    <Button
      emptyBlue
      className={`${styles.refreshButton} ${className}`}
      onClick={onClick}
      disabled={loading}
      ariaLabel="Actualizar"
      ariaBusy={loading}
    >
      {loading
        ? <Spinner className={styles.spinner} />
        : <RefreshIcon className={styles.icon} aria-hidden="true" />}
      <span>Actualizar</span>
    </Button>
  );
}

RefreshButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

RefreshButton.defaultProps = {
  loading: false,
  className: '',
};

export default RefreshButton;
