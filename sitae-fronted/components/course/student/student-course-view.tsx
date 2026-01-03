"use client";

import { useCourseContent } from "@/hooks/course/useCourseContent";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft, User } from "lucide-react";
import { StudentLessonsTab } from "./student-lessons-tab";
import { StudentEvaluationsTab } from "./student-evaluations-tab";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { StudentProfile } from "./profile/student-profile";
import Link from "next/link";
import { api } from "@/lib/api-client";

interface StudentCourseViewProps {
  courseId: string;
  isPreview?: boolean;
}

export function StudentCourseView({
  courseId,
  isPreview = false,
}: StudentCourseViewProps) {
  const { course, isLoading, error, isTeacher } = useCourseContent(courseId);
  const [showProfile, setShowProfile] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  const fetchProfileStatus = async () => {
    try {
      const data = await api.get<{
        learning_profile: any;
        course_profile: any;
      }>(`api/profile/course/${courseId}`);

      let completedFields = 0;
      const totalFields = 8;

      if (data.learning_profile) {
        if (data.learning_profile.career) completedFields++;
        if (data.learning_profile.job_role) completedFields++;
        if (data.learning_profile.preferred_modalities?.length > 0)
          completedFields++;
        if (data.learning_profile.interests?.length > 0) completedFields++;
        if (data.learning_profile.devices?.length > 0) completedFields++;
      }

      if (data.course_profile) {
        if (data.course_profile.prereq_level) completedFields++;
        if (data.course_profile.weekly_time) completedFields++;
        if (data.course_profile.goals?.length > 0) completedFields++;
      }

      setProfileCompleteness(Math.round((completedFields / totalFields) * 100));
    } catch (error) {
      console.error("Error fetching profile status:", error);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchProfileStatus();
    }
  }, [courseId]);

  //   Callback cuando el perfil se guarda
  const handleProfileSuccess = () => {
    fetchProfileStatus(); // Refresca el estado del perfil
    setShowProfile(false); // Cierra el modal
  };

  const handleOpenProfile = () => {
    setShowProfile(true);
  };

  // Estados de carga y error
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
          <h3 className="text-lg font-semibold mb-2">
            Error al cargar el curso
          </h3>
          <p className="text-muted-foreground mb-4">
            No se pudo cargar la información del curso
          </p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (showProfile) {
    return (
      <StudentProfile
        courseId={courseId}
        courseName={course.name}
        onBack={() => setShowProfile(false)}
        onSuccess={handleProfileSuccess} //   Pasar el callback
      />
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
  {/* Header */}
  <div className="mb-6">
    <div className="mb-4">
      {/* Back button for teachers */}
      {isTeacher && isPreview && (
        <Link href={`/curso/${courseId}`}>
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a vista docente
          </Button>
        </Link>
      )}

      {/* Desktop layout */}
      <div className="hidden sm:flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {course.name}
            {course.code && (
              <span className="text-muted-foreground ml-2">
                ({course.code})
              </span>
            )}
          </h1>
          {course.teachers.length > 0 && (
            <div className="text-muted-foreground">
              <span className="font-medium">
                Docente{course.teachers.length > 1 ? "s" : ""}:
              </span>{" "}
              {course.teachers.map((t) => t.full_name).join(", ")}
            </div>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <Link href={`/curso/${courseId}/perfil`}>
            <Button variant="outline">
              <User className="h-4 w-4 mr-2" />
              Mi perfil de aprendizaje
            </Button>
          </Link>
          <Badge
            variant="secondary"
            className="bg-brand-green/10 text-brand-green"
          >
            {course.is_active ? "Activo" : "Finalizado"}
          </Badge>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col gap-4 sm:hidden">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground mb-2 break-words">
            {course.name}
            {course.code && (
              <span className="text-muted-foreground ml-2">
                ({course.code})
              </span>
            )}
          </h1>
          {course.teachers.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                Docente{course.teachers.length > 1 ? "s" : ""}:
              </span>{" "}
              {course.teachers.map((t) => t.full_name).join(", ")}
            </div>
          )}
        </div>
        <Link href={`/curso/${courseId}/perfil`}>
          <Button variant="outline" className="w-full">
            <User className="h-4 w-4 mr-2" />
            Mi perfil de aprendizaje
          </Button>
        </Link>
        <Badge
          variant="secondary"
          className="bg-brand-green/10 text-brand-green w-fit"
        >
          {course.is_active ? "Activo" : "Finalizado"}
        </Badge>
      </div>
    </div>
  </div>

      {/* Tabs */}
      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lessons">Lecciones</TabsTrigger>
          <TabsTrigger value="evaluations">
            Quizzes
            {course.evaluations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {
                  course.evaluations.filter((e) => e.status === "pending")
                    .length
                }
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assistant">Asistente IA</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <StudentLessonsTab course={course} />
        </TabsContent>

        <TabsContent value="evaluations">
          <StudentEvaluationsTab courseId={courseId} />
        </TabsContent>

        <TabsContent value="assistant">
          <AIAssistant courseId={course.id} courseName={course.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
