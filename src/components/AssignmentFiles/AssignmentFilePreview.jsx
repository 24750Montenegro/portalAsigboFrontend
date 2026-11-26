import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import PopUp from '../PopUp';
import Spinner from '../Spinner';
import Button from '../Button';
import useAssignmentFile from '../../hooks/useAssignmentFile';
import downloadBlob from '../../helpers/downloadBlob';
import { assignmentFileUrl, isPdfFile } from '../../helpers/assignmentFiles';
import styles from './AssignmentFiles.module.css';

function AssignmentFilePreview({ fileName, close }) {
  const { getFileBlob } = useAssignmentFile();
  const [file, setFile] = useState(null);
  const [failed, setFailed] = useState(false);
  const isPdf = isPdfFile(fileName);

  useEffect(() => {
    let cancelled = false;
    let objectUrl;

    getFileBlob(fileName)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setFile({ blob, url: objectUrl });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileName]);

  return (
    <PopUp close={close} maxWidth={900}>
      <div className={styles.preview}>
        <h2 className={styles.previewTitle}>{fileName}</h2>

        {!file && !failed && <Spinner className={styles.previewSpinner} />}

        {failed && (
          <p className={styles.previewError} role="alert">
            No se pudo cargar la vista previa.
            {' '}
            <a href={assignmentFileUrl(fileName)} target="_blank" rel="noopener noreferrer">
              Abrir el archivo
            </a>
          </p>
        )}

        {file && (isPdf ? (
          <iframe className={styles.pdfFrame} title={`Vista previa de ${fileName}`} src={file.url} />
        ) : (
          <img className={styles.previewImage} src={file.url} alt={`Vista previa de ${fileName}`} />
        ))}

        {file && (
          <div className={styles.previewActions}>
            {isPdf && (
              <a className={styles.openLink} href={file.url} target="_blank" rel="noopener noreferrer">
                Abrir en otra pestaña
              </a>
            )}
            <Button text="Descargar" onClick={() => downloadBlob(file.blob, fileName)} />
          </div>
        )}
      </div>
    </PopUp>
  );
}

export default AssignmentFilePreview;

AssignmentFilePreview.propTypes = {
  fileName: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
};
