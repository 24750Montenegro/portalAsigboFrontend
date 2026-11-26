import React, { useState } from 'react';
import PropTypes from 'prop-types';
import useApiFetch from '../../hooks/useApiFetch';
import useToken from '../../hooks/useToken';
import getTokenPayload from '../../helpers/getTokenPayload';
import { serverHost } from '../../config';
import styles from './ServiceHoursCertificate.module.css';

function ServiceHoursCertificate({ userId }) {
  const token = useToken();
  const { apiFetch } = useApiFetch();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const viewer = token ? getTokenPayload(token) : null;
  const allowed = viewer?.role?.includes('admin')
    || (viewer?.id === userId && viewer?.role?.includes('scolarshipHolder'));
  if (!allowed) return null;

  const download = async (event) => {
    event.preventDefault();
    setError('');
    if (from && to && from > to) {
      setError('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      const response = await apiFetch({
        uri: `${serverHost}/user/${encodeURIComponent(userId)}/service-hours-certificate?${query}`,
        headers: { authorization: token },
      });
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'constancia-horas.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (ex) {
      let message = 'No se pudo descargar la constancia. Inténtalo nuevamente.';
      try {
        const body = await ex.json();
        if (body.err) message = body.err;
      } catch (_) { /* La respuesta no siempre contiene JSON. */ }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.certificate} onSubmit={download}>
      <h3>Constancia de horas de servicio</h3>
      <p>Elige un rango opcional o descarga todas las horas completadas.</p>
      <div className={styles.controls}>
        <label htmlFor="certificate-from">
          Desde
          <input id="certificate-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label htmlFor="certificate-to">
          Hasta
          <input id="certificate-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Generando…' : 'Descargar constancia'}</button>
      </div>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

ServiceHoursCertificate.propTypes = { userId: PropTypes.string.isRequired };
export default ServiceHoursCertificate;
