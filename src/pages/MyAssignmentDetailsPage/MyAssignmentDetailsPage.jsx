import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BackTitle from '../../components/BackTitle';
import LoadingView from '../../components/LoadingView';
import DataField from '../../components/DataField';
import AssignmentSummary from '../../components/AssignmentSummary';
import AssignmentFiles from '../../components/AssignmentFiles';
import NotFoundPage from '../NotFoundPage';
import useFetch from '../../hooks/useFetch';
import useToken from '../../hooks/useToken';
import useSessionData from '../../hooks/useSessionData';
import { serverHost } from '../../config';
import styles from './MyAssignmentDetailsPage.module.css';

function MyAssignmentDetailsPage() {
  const { activityId } = useParams();
  const token = useToken();
  const sessionUser = useSessionData();
  const {
    callFetch, result: assignment, loading, error,
  } = useFetch();

  useEffect(() => {
    if (!activityId || !sessionUser?.id) return;
    callFetch({
      uri: `${serverHost}/activity/${activityId}/assignment/${sessionUser.id}`,
      headers: { authorization: token },
    });
  }, [activityId, sessionUser?.id]);

  const notes = assignment?.notesVisibleToUser ? assignment.notes?.trim() : '';

  return (
    <>
      {assignment && (
        <div className={styles.myAssignmentDetailsPage}>
          <BackTitle title="Detalle de mi actividad" breakPoint="900px" href="/" />

          <AssignmentSummary
            activityId={activityId}
            activity={assignment.activity}
            completed={assignment.completed}
            aditionalServiceHours={assignment.aditionalServiceHours ?? 0}
          />

          {notes && (
            <>
              <h3 className={styles.sectionTitle}>Notas de la asignación</h3>
              <DataField className={styles.notes}>{notes}</DataField>
            </>
          )}

          <h3 className={styles.sectionTitle}>Evidencia</h3>
          <AssignmentFiles files={assignment.files ?? []} />
        </div>
      )}
      {error && <NotFoundPage />}
      {loading && <LoadingView />}
    </>
  );
}

export default MyAssignmentDetailsPage;
