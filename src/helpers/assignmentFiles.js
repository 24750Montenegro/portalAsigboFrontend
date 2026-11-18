/**
 * Límites de los archivos adjuntos de una asignación. Deben coincidir con el backend
 * (`consts.assignmentFiles` y `consts.uploadFileSizeLimit.files`).
 */
export const assignmentFilesLimits = {
  maxPerAssignment: 10,
  maxPerUpload: 5,
  maxSizeBytes: 3000000,
  maxSizeLabel: '3 MB',
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

export const assignmentFilesAccept = assignmentFilesLimits.allowedTypes.join(',');

export const assignmentFilesHint = `Imágenes (JPEG, PNG, WEBP) o PDF. Máximo ${assignmentFilesLimits.maxSizeLabel} por archivo, `
  + `${assignmentFilesLimits.maxPerUpload} por subida y ${assignmentFilesLimits.maxPerAssignment} por asignación.`;

/**
 * Decide qué archivos elegidos se pueden agregar a la subida pendiente.
 * @param {File[]} files archivos recién elegidos.
 * @param {{existingCount: number, pendingCount: number}} counts archivos ya guardados (sin los
 * marcados para eliminar) y archivos nuevos ya elegidos pero aún no enviados.
 * @returns {{accepted: File[], errors: string[]}}
 */
export const selectFilesToAdd = (files, { existingCount, pendingCount }) => {
  const {
    allowedTypes, maxSizeBytes, maxSizeLabel, maxPerUpload, maxPerAssignment,
  } = assignmentFilesLimits;
  const accepted = [];
  const errors = [];

  files.forEach((file) => {
    if (!allowedTypes.includes(file.type)) {
      errors.push(`"${file.name}" no es de un tipo permitido. Solo se permiten imágenes (JPEG, PNG, WEBP) y PDF.`);
    } else if (file.size > maxSizeBytes) {
      errors.push(`"${file.name}" supera el tamaño máximo de ${maxSizeLabel}.`);
    } else if (pendingCount + accepted.length >= maxPerUpload) {
      errors.push(`"${file.name}" no se agregó: solo se pueden subir ${maxPerUpload} archivos a la vez.`);
    } else if (existingCount + pendingCount + accepted.length >= maxPerAssignment) {
      errors.push(`"${file.name}" no se agregó: una asignación puede tener como máximo ${maxPerAssignment} archivos.`);
    } else {
      accepted.push(file);
    }
  });

  return { accepted, errors };
};

/** Mensaje que `useFetch` usa cuando la respuesta no trae ningún texto de error. */
const genericFetchError = 'Ocurrió un error.';

/**
 * Mensaje para el modal de error al guardar la asignación. Prioriza el `err` del backend; si no
 * llegó (respuesta cortada por un proxy, sin conexión), lo explica en lugar del genérico.
 * @param {{status?: number, message?: string} | null} error error de `useFetch`.
 */
export const describeAssignmentUpdateError = (error) => {
  if (!error) return undefined;
  if (error.message && error.message !== genericFetchError) return error.message;
  if (error.status === 413) {
    return `Los archivos superan el tamaño permitido por el servidor. Cada archivo puede pesar como máximo ${assignmentFilesLimits.maxSizeLabel}.`;
  }
  if (!error.status) {
    return 'No se pudo completar la solicitud. Revisa tu conexión a internet e inténtalo de nuevo.';
  }
  return `Ocurrió un error al guardar los cambios (código ${error.status}).`;
};
