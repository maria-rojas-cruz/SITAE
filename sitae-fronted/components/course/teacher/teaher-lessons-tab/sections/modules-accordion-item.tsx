import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import { ModuleEditSheet } from "../../course-edit/sheets/module-edit-sheet";
import { TopicCreateSheet } from "../../course-edit/sheets/topic-create-sheet";
import { ExpandableText } from "../components/expandable-text";
import { TopicAccordionItem } from "./topic-accordion-item";

interface ModuleAccordionItemProps {
  courseId: string;
  module: any;
  learningOutcomes: any[];
  getNextTopicOrder: (moduleId: string) => number;
  getNextResourceOrder: (topicId: string) => number;
  onSuccess: () => void;
}

export function ModuleAccordionItem({
  courseId,
  module,
  learningOutcomes,
  getNextTopicOrder,
  getNextResourceOrder,
  onSuccess,
}: ModuleAccordionItemProps) {
  return (
    <AccordionItem
      value={`module-${module.id}`}
      className="border border-slate-200 rounded-lg overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 transition-colors">
        <div className="flex items-center justify-between w-full mr-4">
          <div className="text-left flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">{module.title}</h4>
              <ModuleEditSheet
                courseId={courseId}
                module={module}
                learningOutcomes={learningOutcomes}
                onSuccess={onSuccess}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
            {module.description && (
              <p className="text-sm text-slate-600 mt-1">
                <ExpandableText text={module.description} maxLength={120} />
              </p>
            )}
            {module.objectives.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Objetivos del módulo:
                </p>
                <ul className="space-y-1.5">
                  {module.objectives.map((obj: any) => (
                    <li
                      key={obj.id}
                      className="flex items-start gap-2 text-xs text-slate-700"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      <span className="flex-1">{obj.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 bg-slate-50/50">
        <div className="space-y-4 pt-4">
          {/* Topics Header */}
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-sm text-slate-900">
              Temas ({module.topics.length})
            </h5>
            <TopicCreateSheet
            courseId={courseId}
              moduleId={module.id}
              moduleObjectives={module.objectives.map((obj: any) => ({
                id: obj.id,
                description: obj.description,
                code: obj.code || undefined,
              }))}
              nextOrder={getNextTopicOrder(module.id)}
              onSuccess={onSuccess}
              trigger={
                <Button size="sm" variant="outline" className="bg-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Tema
                </Button>
              }
            />
          </div>

          {module.topics.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6 bg-white rounded-lg border border-slate-200">
              No hay temas creados en este módulo
            </p>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {module.topics.map((topic: any) => (
                <TopicAccordionItem
                              courseId={courseId}

                  key={topic.id}
                  moduleId={module.id}
                  topic={topic}
                  moduleObjectives={module.objectives.map((obj: any) => ({
                    id: obj.id,
                    description: obj.description,
                    code: obj.code || undefined,
                  }))}
                  getNextResourceOrder={getNextResourceOrder}
                  onSuccess={onSuccess}
                />
              ))}
            </Accordion>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}