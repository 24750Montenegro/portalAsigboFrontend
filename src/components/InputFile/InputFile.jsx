import React from 'react';
import PropTypes from 'prop-types';
import { FaFileUpload as UploadIcon } from 'react-icons/fa';
import styles from './InputFile.module.css';
import Button from '../Button';

function InputFile({
  className, onChange, disabled, accept, disabledTitle,
}) {
  const handleOnChange = (evt) => {
    const images = evt.target.files;
    if (onChange && images) onChange(Array.from(images));
    // Permite volver a elegir el mismo archivo después de quitarlo de la lista.
    // eslint-disable-next-line no-param-reassign
    evt.target.value = '';
  };
  return (
    <Button className={`${styles.inputFileContainer} ${className} ${disabled ? styles.disabled : ''}`}>
      <input
        type="file"
        className={styles.inputFile}
        onChange={handleOnChange}
        multiple
        accept={accept ?? undefined}
        disabled={disabled}
        title={disabled ? disabledTitle : null}
      />
      <UploadIcon className={styles.uploadButtIcon} />
      Subir archivos
    </Button>
  );
}

export default InputFile;

InputFile.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  accept: PropTypes.string,
  disabledTitle: PropTypes.string,
};

InputFile.defaultProps = {
  className: '',
  onChange: null,
  disabled: false,
  accept: null,
  disabledTitle: 'Se alcanzó el máximo de archivos.',
};
