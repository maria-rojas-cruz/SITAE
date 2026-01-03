import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { TopicEditSheet } from "../../course-edit/sheets/topic-edit-sheet";
import { ExpandableText } from "../components/expandable-text";
import { ResourcesSection } from "./resources-section";
import { QuizzesSection } from "./quizzes-section";

interface TopicAccordionItemProps {
    courseId: string;
  moduleId: string;
  topic: any;
  moduleObjectives: any[];
  getNextResourceOrder: (topicId: string) => number;
  onSuccess: () => void;
}

export function TopicAccordionItem({
    courseId,
  moduleId,
  topic,
  moduleObjectives,
  getNextResourceOrder,
  onSuccess,
}: TopicAccordionItemProps) {
  return (
    <AccordionItem value={`topic-${topic.id}`} className="border-none">
      <div className="bg-white border-l-4 border-l-slate-900 rounded-lg shadow-sm overflow-hidden">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors">
          <div className="text-left flex-1">
            <div className="flex items-center gap-2">
              <h5 className="font-semibold text-slate-900">{topic.title}</h5>
              <TopicEditSheet
              courseId={courseId}
                moduleId={moduleId}
                topic={topic}
                moduleObjectives={moduleObjectives}
                onSuccess={onSuccess}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            </div>
            {topic.description && (
              <p className="text-sm text-slate-600 mt-1">
                <ExpandableText text={topic.description} maxLength={100} />
              </p>
            )}
            {topic.objectives.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {topic.objectives.map((obj: any) => (
                  <Badge
                    key={obj.id}
                    variant="secondary"
                    className="text-xs bg-slate-100 text-slate-700"
                  >
                    {obj.description}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4 bg-slate-50/30">
          <div className="space-y-4 pt-2">
            <ResourcesSection
                          courseId={courseId}

              topicId={topic.id}
              resources={topic.resources}
              topicObjectives={topic.objectives}
              nextOrder={getNextResourceOrder(topic.id)}
              onSuccess={onSuccess}
            />

            <QuizzesSection
                          courseId={courseId}

              topicId={topic.id}
              quizzes={topic.quizzes}
              topicObjectives={topic.objectives}
              onSuccess={onSuccess}
            />
          </div>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
}