import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { ModuleCreateSheet } from "../../course-edit/sheets/module-create-sheet";
import { ModuleAccordionItem } from "./modules-accordion-item";

interface ModulesSectionProps {
  courseId: string;
  modules: any[];
  learningOutcomes: any[];
  getNextModuleOrder: () => number;
  getNextTopicOrder: (moduleId: string) => number;
  getNextResourceOrder: (topicId: string) => number;
  onSuccess: () => void;
}

export function ModulesSection({
  courseId,
  modules,
  learningOutcomes,
  getNextModuleOrder,
  getNextTopicOrder,
  getNextResourceOrder,
  onSuccess,
}: ModulesSectionProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <BookOpen className="h-5 w-5 text-primary" />
            Contenido del Curso
          </CardTitle>
          <CardDescription className="mt-1">
            Organiza el contenido en módulos y temas
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ModuleCreateSheet
            courseId={courseId}
            learningOutcomes={learningOutcomes}
            nextOrder={getNextModuleOrder()}
            onSuccess={onSuccess}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Módulo
              </Button>
            }
          />
        </div>
      </CardHeader>

      <CardContent>
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Aún no hay contenido
            </h3>
            <p className="text-slate-600 mb-4 text-sm">
              Empieza creando un módulo para organizar el contenido del curso
            </p>
            <ModuleCreateSheet
              courseId={courseId}
              learningOutcomes={learningOutcomes}
              nextOrder={getNextModuleOrder()}
              onSuccess={onSuccess}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Módulo
                </Button>
              }
            />
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {modules.map((module) => (
              <ModuleAccordionItem
                key={module.id}
                courseId={courseId}
                module={module}
                learningOutcomes={learningOutcomes}
                getNextTopicOrder={getNextTopicOrder}
                getNextResourceOrder={getNextResourceOrder}
                onSuccess={onSuccess}
              />
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}