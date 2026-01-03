import { moduleService } from "./module-service";

/**
 * Sincroniza los learning outcomes vinculados de un objetivo
 * Agrega los nuevos y elimina los que ya no están
 */
export async function syncLearningOutcomeLinks(
  moduleId: string,
  objectiveId: string,
  desiredLearningOutcomeIds: string[]
) {
  // Obtener vínculos actuales
  const currentLinks = await moduleService.getLinkedLearningOutcomes(
    moduleId,
    objectiveId
  );
  const currentIds = currentLinks.map((link) => link.id);

  // Agregar nuevos vínculos
  const toAdd = desiredLearningOutcomeIds.filter(
    (id) => !currentIds.includes(id)
  );
  for (const loId of toAdd) {
    await moduleService.linkLearningOutcome(moduleId, objectiveId, {
      learning_outcome_id: loId,
      is_primary: false,
    });
  }

  // Eliminar vínculos removidos
  const toRemove = currentIds.filter(
    (id) => !desiredLearningOutcomeIds.includes(id)
  );
  for (const loId of toRemove) {
    await moduleService.unlinkLearningOutcome(moduleId, objectiveId, loId);
  }
}

/**
 * Crea un objetivo con sus learning outcomes vinculados
 */
export async function createObjectiveWithLinks(
  moduleId: string,
  objectiveData: {
    description: string;
    code?: string | null;
    order: number;
  },
  learningOutcomeIds: string[]
) {
  // Crear objetivo
  const response = await moduleService.createObjective(moduleId, objectiveData);
  const objectiveId = response.id;

  // Vincular learning outcomes
  for (const loId of learningOutcomeIds) {
    await moduleService.linkLearningOutcome(moduleId, objectiveId, {
      learning_outcome_id: loId,
      is_primary: false,
    });
  }

  return objectiveId;
}