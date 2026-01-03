"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Edit,
  BarChart3,
  Clock,
  Loader2,
  Zap,
} from "lucide-react";
import { QuizQuickEditSheet } from "./course-edit/quiz/quiz-quick-edit-sheet";
import { QuizEditWizard } from "./course-edit/quiz/quiz-edit-wizard";
import { QuizCreateWizardWithSelector } from "./course-edit/quiz/quiz-create-wizard-with-selector";

interface TeacherQuizzesTabProps {
  courseId: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  time_minutes?: number;
  is_active: boolean;
  topic_id: string;
  topic_title: string;
  module_title: string;
  questions_count: number;
  order: number;
}

export function TeacherQuizzesTab({ courseId }: TeacherQuizzesTabProps) {
  const [filterStatus, setFilterStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: editData, error, mutate } = useSWR(
    `/api/courses/${courseId}/edit-data`
  );

  const handleSuccess = () => {
    mutate();
  };

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error al cargar quizzes
      </div>
    );
  }

  if (!editData) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Extraer todos los quizzes de los módulos
  const allQuizzes: Quiz[] =
    editData.modules?.flatMap((module: any) =>
      module.topics.flatMap((topic: any) =>
        topic.quizzes.map((quiz: any) => ({
          ...quiz,
          topic_title: topic.title,
          module_title: module.title,
          topic_id: topic.id,
          questions_count: 0, // Esto se podría obtener del backend
        }))
      )
    ) || [];

  const filteredQuizzes = allQuizzes.filter((quiz) => {
    const matchesStatus =
      filterStatus === "todos" ||
      (filterStatus === "published" && quiz.is_active) ||
      (filterStatus === "draft" && !quiz.is_active);
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.topic_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.module_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800"
      : "bg-slate-100 text-slate-600";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Publicado" : "Borrador";
  };

  // Obtener objetivos del tema para el wizard
  const getTopicObjectives = (topicId: string) => {
    for (const module of editData.modules) {
      const topic = module.topics.find((t: any) => t.id === topicId);
      if (topic) {
        return topic.objectives || [];
      }
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Gestión de Quizzes
          </h2>
          <p className="text-slate-600">
            Crea y administra las evaluaciones de tu curso
          </p>
        </div>
        <QuizCreateWizardWithSelector
          courseId={courseId}
          modules={editData.modules}
          onSuccess={handleSuccess}
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Quiz
            </Button>
          }
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredQuizzes.map((quiz) => (
          <Card key={quiz.id} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-slate-900">
                    {quiz.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-slate-600">
                    {quiz.module_title} → {quiz.topic_title}
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className={getStatusColor(quiz.is_active)}
                >
                  {getStatusText(quiz.is_active)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {quiz.time_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Duración:</span>
                    <span className="font-medium text-slate-900">
                      {quiz.time_minutes} min
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Preguntas:</span>
                  <span className="font-medium text-slate-900">
                    {quiz.questions_count}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <QuizQuickEditSheet
                  courseId={courseId}
                  topicId={quiz.topic_id}
                  quiz={quiz}
                  onSuccess={handleSuccess}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Edición Rápida
                    </Button>
                  }
                />
                <QuizEditWizard
                  courseId={courseId}
                  topicId={quiz.topic_id}
                  quiz={quiz}
                  topicObjectives={getTopicObjectives(quiz.topic_id)}
                  onSuccess={handleSuccess}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edición Completa
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-12 w-12 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-900">
            No se encontraron quizzes
          </h3>
          <p className="text-slate-600 mb-4">
            {searchTerm || filterStatus !== "todos"
              ? "Intenta ajustar los filtros de búsqueda"
              : "Crea tu primer quiz para evaluar a tus estudiantes"}
          </p>
          <QuizCreateWizardWithSelector
            courseId={courseId}
            modules={editData.modules}
            onSuccess={handleSuccess}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Quiz
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}