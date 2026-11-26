import useApiFetch from './useApiFetch';
import useToken from './useToken';
import { assignmentFileUrl, isPdfFile } from '../helpers/assignmentFiles';

/**
 * Descarga un adjunto de asignación como Blob, con el token de sesión, para que la vista previa
 * y la descarga funcionen aunque la API proteja la ruta de archivos.
 */
function useAssignmentFile() {
  const token = useToken();
  const { apiFetch } = useApiFetch();

  const getFileBlob = async (fileName) => {
    const reply = await apiFetch({
      uri: assignmentFileUrl(fileName),
      headers: { authorization: token },
    });
    const blob = await reply.blob();
    if (isPdfFile(fileName) && blob.type !== 'application/pdf') {
      return new Blob([blob], { type: 'application/pdf' });
    }
    return blob;
  };

  return { getFileBlob };
}

export default useAssignmentFile;
