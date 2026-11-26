import React from 'react';
import PropTypes from 'prop-types';
import { FaFile as FileIcon, FaImage as ImageIcon } from 'react-icons/fa6';
import styles from './FilesTable.module.css';

import Table from '../Table/Table';
import TableRow from '../TableRow/TableRow';
import Button from '../Button';

function FilesTable({ files, className }) {
  return (
    <Table showCheckbox={false} className={`${styles.filesTable} ${className}`} breakPoint="700px">
      {files?.map((file) => (
        <TableRow key={file.id}>
          <td className={styles.typeRow}>
            <div>{file.type?.indexOf('image') !== -1 ? <ImageIcon /> : <FileIcon />}</div>
          </td>
          <td className={styles.nameRow}>
            {file.onPreview ? (
              <span className={styles.fileName} title={file.name}>{file.name}</span>
            ) : (
              <a href={file.link ?? '#'} target="_blank" rel="noopener noreferrer">{file.name}</a>
            )}
          </td>
          <td className={styles.actionsRow}>
            <div>
              {file.onPreview && (
                <Button
                  emptyBlue
                  text="Ver"
                  ariaLabel={`Ver ${file.name}`}
                  onClick={() => file.onPreview(file.id)}
                />
              )}
              {file.onDownload && (
                <Button
                  text="Descargar"
                  ariaLabel={`Descargar ${file.name}`}
                  onClick={() => file.onDownload(file.id)}
                />
              )}
              {file.onDelete && (
                <Button red text="Eliminar" onClick={() => file.onDelete(file.id)} />
              )}
            </div>
          </td>
        </TableRow>
      ))}
    </Table>
  );
}

export default FilesTable;

FilesTable.propTypes = {
  files: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    link: PropTypes.string,
    onPreview: PropTypes.func,
    onDownload: PropTypes.func,
    onDelete: PropTypes.func,
  })),
  className: PropTypes.string,
};

FilesTable.defaultProps = {
  files: [],
  className: '',
};
