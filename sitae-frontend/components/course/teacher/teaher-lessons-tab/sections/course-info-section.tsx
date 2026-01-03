import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { CourseInfoEditSheet } from "../../course-edit/sheets/course-info-edit-sheet";
import { ExpandableText } from "../components/expandable-text";

interface CourseInfoSectionProps {
  courseId: string;
  courseName: string;
  courseCode?: string;
  courseDescription?: string;
  teachers: { id: string; full_name: string }[];
  onSuccess: () => void;
}

export function CourseInfoSection({
  courseId,
  courseName,
  courseCode,
  courseDescription,
  teachers,
  onSuccess,
}: CourseInfoSectionProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-slate-900">
          Información General del Curso
        </CardTitle>
        <CourseInfoEditSheet
          courseId={courseId}
          courseName={courseName}
          courseCode={courseCode}
          courseDescription={courseDescription}
          onSuccess={onSuccess}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-transparent"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {courseDescription && (
          <div>
            <h4 className="font-medium text-slate-900 text-sm mb-2">
              Descripción
            </h4>
            <p className="text-sm leading-relaxed">
              <ExpandableText text={courseDescription} maxLength={200} />
            </p>
          </div>
        )}

        {teachers.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-medium text-slate-900 text-sm mb-2">Docentes</h4>
            <div className="flex flex-wrap gap-2">
              {teachers.map((teacher) => (
                <Badge
                  key={teacher.id}
                  variant="secondary"
                  className="bg-slate-100 text-slate-700"
                >
                  {teacher.full_name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}