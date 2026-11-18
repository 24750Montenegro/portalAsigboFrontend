import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import useActivityResponsibles from '@hooks/useActivityResponsibles';
import useFetch from '@hooks/useFetch';
import useToken from '@hooks/useToken';
import usePopUp from '@hooks/usePopUp';
import { serverHost } from '@/config';
import AddUsersPopUp from '@components/AddUsersPopUp';
import Button from '@components/Button';
import SuccessNotificationPopUp from '@components/SuccessNotificationPopUp';
import ErrorNotificationPopUp from '@components/ErrorNotificationPopUp';
import styles from './ActivityResponsibles.module.css';
import ActivityResponsiblesTable from '../ActivityResponsiblesTable/ActivityResponsiblesTable';

/**
 * Pestaña «Encargados»: solo los encargados de la actividad y, para quien la gestiona, un botón
 * para agregar varios a la vez (sin ofrecer a los que ya lo son). Los datos vienen de
 * `useActivityResponsibles`, cuyo `refetch` los recarga.
 *
 * @param onChange Se llama tras guardar cambios, para que la página recargue la actividad.
 */
function ActivityResponsibles({ activityData, canManage, onChange }) {
  const token = useToken();
  const {
    responsibles, loading, refetch,
  } = useActivityResponsibles(activityData?.id, activityData?.responsible);

  const {
    callFetch: saveResponsibles, result: saveResult, loading: saving, error: saveError,
  } = useFetch();

  const [isAddOpen, openAdd, closeAdd] = usePopUp();
  const [isSuccessOpen, openSuccess, closeSuccess] = usePopUp();
  const [isErrorOpen, openError, closeError] = usePopUp();

  useEffect(() => {
    if (!saveResult) return;
    closeAdd();
    refetch();
    if (onChange) onChange();
    openSuccess();
  }, [saveResult]);

  useEffect(() => {
    if (saveError) openError();
  }, [saveError]);

  const currentIds = responsibles.map((user) => user.id);

  const handleAdd = (idUsers) => {
    // El PATCH de la actividad reemplaza la lista completa: se envían los actuales más los nuevos.
    const data = new FormData();
    [...currentIds, ...idUsers.filter((id) => !currentIds.includes(id))]
      .forEach((id) => data.append('responsible[]', id));
    saveResponsibles({
      uri: `${serverHost}/activity/${activityData.id}`,
      method: 'PATCH',
      body: data,
      headers: { authorization: token },
      removeContentType: true,
      parse: false,
    });
  };

  return (
    <div className={styles.main}>
      <h2>Encargados</h2>
      <div className={styles.toolbar}>
        <p className={styles.counter}>
          {`${responsibles.length} ${responsibles.length === 1 ? 'encargado' : 'encargados'}`}
        </p>
        {canManage && <Button text="Agregar encargados" onClick={openAdd} />}
      </div>
      <ActivityResponsiblesTable responsibles={responsibles} loading={loading} />

      <AddUsersPopUp
        isOpen={isAddOpen}
        close={closeAdd}
        title="Agregar encargados"
        actionText="Agregar"
        extraParams={{ exclude: currentIds }}
        onConfirm={handleAdd}
        loading={saving}
      />
      <SuccessNotificationPopUp
        isOpen={isSuccessOpen}
        close={closeSuccess}
        text="Los encargados han sido agregados de forma exitosa."
      />
      <ErrorNotificationPopUp isOpen={isErrorOpen} close={closeError} text={saveError?.message} />
    </div>
  );
}

ActivityResponsibles.propTypes = {
  activityData: PropTypes.instanceOf(Object).isRequired,
  canManage: PropTypes.bool,
  onChange: PropTypes.func,
};

ActivityResponsibles.defaultProps = {
  canManage: false,
  onChange: null,
};

export default ActivityResponsibles;
