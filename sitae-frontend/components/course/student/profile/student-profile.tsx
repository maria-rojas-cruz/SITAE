"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { useStudentProfile } from "./hooks/useStudentProfile";
import { useProfileCompleteness } from "./hooks/useProfileCompleteness";
import { ProfileHeader } from "./sections/profile-header";
import { ProgressCard } from "./sections/progress-card";
import { CourseProfileTab } from "./sections/course-profile-tab";
import { AcademicProfileTab } from "./sections/academic-profile-tab";
import type { StudentProfileProps } from "./types";

export function StudentProfile({
  courseId,
  courseName,
  onBack,
}: StudentProfileProps) {
  const {
    profileData,
    isLoading,
    isLoadingProfile,
    handleSave,
    handleCheckboxChange,
    updateField,
  } = useStudentProfile(courseId);

  const { completeness, courseProgress, academicProgress } =
    useProfileCompleteness(profileData);

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <ProfileHeader onBack={onBack} />
      <ProgressCard completeness={completeness} />

      <Tabs defaultValue="course" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="course">
            Perfil del Curso
            <Badge variant="outline" className="ml-2">
              {courseProgress}/3
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="academic">
            Perfil Académico
            <Badge variant="outline" className="ml-2">
              {academicProgress}/5
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="course">
          <CourseProfileTab
            courseName={courseName}
            profileData={profileData}
            onUpdateField={updateField}
            onCheckboxChange={handleCheckboxChange}
          />
        </TabsContent>

        <TabsContent value="academic">
          <AcademicProfileTab
            profileData={profileData}
            onUpdateField={updateField}
            onCheckboxChange={handleCheckboxChange}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}