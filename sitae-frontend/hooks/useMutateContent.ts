import { useSWRConfig } from "swr";
import { useCallback } from "react";

/**
 * Hook para invalidar el cache del contenido del curso después de mutaciones
 * Esto asegura que la UI se actualice automáticamente sin recargar la página
 */
export function useMutateContent(courseId: string) {
  const { mutate } = useSWRConfig();

  const mutateContent = useCallback(async () => {
    // Invalidar el cache de SWR para forzar re-fetch de los datos
    await mutate(`/api/courses/${courseId}/edit-data`);
  }, [courseId, mutate]);

  return { mutateContent };
}