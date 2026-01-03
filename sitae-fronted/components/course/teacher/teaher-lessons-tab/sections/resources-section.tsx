import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ResourceCreateSheet } from "../../course-edit/sheets/resource-create-sheet";
import { ResourceEditSheet } from "../../course-edit/sheets/resource-edit-sheet";
import { ResourceIcon } from "../components/resource-icon";

interface ResourcesSectionProps {
        courseId: string;

  topicId: string;
  resources: any[];
  topicObjectives: any[];
  nextOrder: number;
  onSuccess: () => void;
}

export function ResourcesSection({
    courseId,
  topicId,
  resources,
  topicObjectives,
  nextOrder,
  onSuccess,
}: ResourcesSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h6 className="text-sm font-semibold text-slate-900">
          Recursos ({resources.length})
        </h6>
        <ResourceCreateSheet
        courseId={courseId}
          topicId={topicId}
          topicObjectives={topicObjectives}
          nextOrder={nextOrder}
          onSuccess={onSuccess}
          trigger={
            <Button size="sm" variant="outline" className="bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          }
        />
      </div>

      {resources.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
          No hay recursos agregados
        </p>
      ) : (
        <div className="space-y-2">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:shadow-sm hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-3 flex-1">
                <ResourceIcon type={resource.type} />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium text-sm text-slate-900 truncate">
                    {resource.title}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <ResourceEditSheet
                courseId={courseId}
                  topicId={topicId}
                  resource={resource}
                  topicObjectives={topicObjectives}
                  onSuccess={onSuccess}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                {/*<Button variant="ghost" size="sm">
                  <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-600" />
                </Button>*/}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}