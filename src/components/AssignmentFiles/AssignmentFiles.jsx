import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FilesTable from '../FilesTable';
import AssignmentFilePreview from './AssignmentFilePreview';
import useAssignmentFile from '../../hooks/useAssignmentFile';
import downloadBlob from '../../helpers/downloadBlob';
import { assignmentFileType } from '../../helpers/assignmentFiles';
import styles from './AssignmentFiles.module.css';

/**
 * Adjuntos de evidencia de una asignación. Lo usan tanto el admin/encargado como el becado, de
 * modo que ambos ven exactamente los mismos archivos. Sin `onDelete` la lista es de solo lectura.
 */
function AssignmentFiles({
  files, pendingFiles, onDelete, emptyText, className,
}) {
  const { getFileBlob } = useAssignmentFile();
  const [previewFile, setPreviewFile] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  const download = async (fileName) => {
    setDownloadError(null);
    try {
      downloadBlob(await getFileBlob(fileName), fileName);
    } catch {
      setDownloadError(`No se pudo descargar "${fileName}". Inténtalo de nuevo.`);
    }
  };

  const rows = [
    ...files.map((fileName) => ({
      id: fileName,
      name: fileName,
      type: assignmentFileType(fileName),
      onPreview: setPreviewFile,
      onDownload: download,
      onDelete: onDelete ?? undefined,
    })),
    ...pendingFiles,
  ];

  return (
    <div className={`${styles.assignmentFiles} ${className}`}>
      {rows.length > 0
        ? <FilesTable files={rows} />
        : <p className={styles.emptyText}>{emptyText}</p>}

      {downloadError && <p className={styles.downloadError} role="alert">{downloadError}</p>}

      {previewFile && (
        <AssignmentFilePreview fileName={previewFile} close={() => setPreviewFile(null)} />
      )}
    </div>
  );
}

export default AssignmentFiles;

AssignmentFiles.propTypes = {
  files: PropTypes.arrayOf(PropTypes.string),
  pendingFiles: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    link: PropTypes.string,
    onDelete: PropTypes.func,
  })),
  onDelete: PropTypes.func,
  emptyText: PropTypes.string,
  className: PropTypes.string,
};

AssignmentFiles.defaultProps = {
  files: [],
  pendingFiles: [],
  onDelete: null,
  emptyText: 'No se adjuntaron archivos de evidencia.',
  className: '',
};
