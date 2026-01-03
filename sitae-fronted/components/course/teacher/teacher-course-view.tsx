"use client";

import { useState } from "react";
import { useCourseContent } from "@/hooks/course/useCourseContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Eye } from "lucide-react";
import { TeacherLessonsTab } from "./teaher-lessons-tab/teacher-lessons-tab";
import { TeacherQuizzesTab } from "./teacher-quizzes-tab";
import { TeacherDashboardTab } from "./teacher-dashboard-tab/teacher-dashboard-tab";
import Link from "next/link";

interface TeacherCourseViewProps {
  courseId: string;
}

export function TeacherCourseView({ courseId }: TeacherCourseViewProps) {
  const { course, isLoading, error } = useCourseContent(courseId);
  const [activeTab, setActiveTab] = useState("lessons");

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar el curso</h3>
          <p className="text-muted-foreground mb-4">
            No se pudo cargar la información del curso
          </p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {course.name}
              {course.code && (
                <span className="text-muted-foreground ml-2">({course.code})</span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Docente</p>
          </div>
          {/*<Link href={`/curso/${courseId}/vista-estudiante`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver como estudiante
            </Button>
          </Link> */}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lessons">Lecciones</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <TeacherLessonsTab course={course} courseId={courseId} />
        </TabsContent>

        <TabsContent value="quizzes">
          <TeacherQuizzesTab courseId={courseId} />
        </TabsContent>

        <TabsContent value="dashboard">
          <TeacherDashboardTab courseId={courseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}