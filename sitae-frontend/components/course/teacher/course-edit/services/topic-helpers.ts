import { topicService } from "./topic-service";

/**
 * Sincroniza los module objectives vinculados de un objetivo de tema
 * Agrega los nuevos y elimina los que ya no están
 */
export async function syncModuleObjectiveLinks(
  topicId: string,
  objectiveId: string,
  desiredModuleObjectiveIds: string[]
) {
  // Obtener vínculos actuales
  const currentLinks = await topicService.getLinkedModuleObjectives(
    topicId,
    objectiveId
  );
  const currentIds = currentLinks.map((link) => link.id);

  // Agregar nuevos vínculos
  const toAdd = desiredModuleObjectiveIds.filter(
    (id) => !currentIds.includes(id)
  );
  for (const moId of toAdd) {
    await topicService.linkModuleObjective(topicId, objectiveId, {
      module_objective_id: moId,
      is_primary: false,
    });
  }

  // Eliminar vínculos removidos
  const toRemove = currentIds.filter(
    (id) => !desiredModuleObjectiveIds.includes(id)
  );
  for (const moId of toRemove) {
    await topicService.unlinkModuleObjective(topicId, objectiveId, moId);
  }
}

/**
 * Crea un objetivo de tema con sus module objectives vinculados
 */
export async function createTopicObjectiveWithLinks(
  topicId: string,
  objectiveData: {
    description: string;
    code?: string | null;
    order: number;
  },
  moduleObjectiveIds: string[]
) {
  // Crear objetivo
  const response = await topicService.createObjective(topicId, objectiveData);
  const objectiveId = response.id;

  // Vincular module objectives
  for (const moId of moduleObjectiveIds) {
    await topicService.linkModuleObjective(topicId, objectiveId, {
      module_objective_id: moId,
      is_primary: false,
    });
  }

  return objectiveId;
}