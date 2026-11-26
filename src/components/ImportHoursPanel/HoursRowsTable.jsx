import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@components/Button';
import { formatGuatemalaDateTime, hoursRowStatusLabel } from '@helpers/hoursImportPreview';
import styles from './ImportHoursPanel.module.css';

const PAGE_SIZE = 50;

/** Vista previa de cada fila antes de confirmar, paginada de 50 en 50. */
function HoursRowsTable({ rows }) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className={`${styles.tableWrapper} ${styles.scrollable}`}>
        <table className={styles.table} aria-label="Vista previa por fila">
          <thead>
            <tr>
              <th>Fila</th>
              <th>Carné</th>
              <th>Becado</th>
              <th>Actividad</th>
              <th>Eje</th>
              <th>Fecha (Guatemala)</th>
              <th>Horas</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.row} className={item.status === 'error' ? styles.errorRow : undefined}>
                <td>{item.row}</td>
                <td>{item.carnet}</td>
                <td>{item.studentName ?? '—'}</td>
                <td>{item.activityName ?? '—'}</td>
                <td>{item.areaName ?? '—'}</td>
                <td>{formatGuatemalaDateTime(item.date)}</td>
                <td>{item.hours ?? '—'}</td>
                <td>{hoursRowStatusLabel(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className={styles.pagination}>
          <Button text="Anterior" emptyBlue onClick={() => setPage(page - 1)} disabled={page === 0} />
          <span>{`Filas ${start + 1}–${start + visible.length} de ${rows.length}`}</span>
          <Button text="Siguiente" emptyBlue onClick={() => setPage(page + 1)} disabled={page >= pages - 1} />
        </div>
      )}
    </div>
  );
}

export default HoursRowsTable;

HoursRowsTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({
    row: PropTypes.number.isRequired,
    carnet: PropTypes.string.isRequired,
    studentName: PropTypes.string,
    activityName: PropTypes.string,
    areaName: PropTypes.string,
    date: PropTypes.string,
    hours: PropTypes.number,
    status: PropTypes.string.isRequired,
    error: PropTypes.string,
  })).isRequired,
};
