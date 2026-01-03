"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Play,
  FileText,
  Code,
  Clock,
  ExternalLink,
  Timer,
  Target,
  Info,
} from "lucide-react";
import { CourseContent } from "@/types/course-content";
import Link from "next/link";

interface StudentLessonsTabProps {
  course: CourseContent;
}

// Componente para texto con "leer más"
function ExpandableText({
  text,
  maxLength = 150,
}: {
  text: string;
  maxLength?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <span className="text-slate-700">{text}</span>;
  }

  return (
    <span className="text-slate-700">
      {isExpanded ? text : `${text.substring(0, maxLength)}... `}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="text-primary hover:underline font-medium ml-1 text-sm"
      >
        {isExpanded ? "leer menos" : "leer más"}
      </button>
    </span>
  );
}

// Componente para iconos de tipo de recurso
function ResourceIcon({ type }: { type: string }) {
  const iconClass = "h-4 w-4 text-slate-500";

  switch (type.toLowerCase()) {
    case "video":
      return <Play className={iconClass} />;
    case "lectura":
    case "reading":
    case "pdf":
      return <FileText className={iconClass} />;
    case "code":
    case "codigo":
    case "ejercicio":
      return <Code className={iconClass} />;
    case "quiz":
      return <BookOpen className={iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
}

export function StudentLessonsTab({ course }: StudentLessonsTabProps) {
  return (
    <div className="space-y-6">
      {/* Información General */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-slate-900">
              Información General del Curso
            </CardTitle>
          </div>
          <CardDescription>Descripción y detalles del curso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {course.description && (
            <div>
              <h4 className="font-medium text-slate-900 text-sm mb-2">
                Descripción
              </h4>
              <p className="text-sm leading-relaxed">
                <ExpandableText text={course.description} maxLength={200} />
              </p>
            </div>
          )}

          {course.teachers.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-medium text-slate-900 text-sm mb-2">
                Docentes
              </h4>
              <div className="flex flex-wrap gap-2">
                {course.teachers.map((teacher) => (
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

      {/* Learning Outcomes */}
      {course.learning_outcomes.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <Target className="h-5 w-5 text-primary" />
                Resultados de Aprendizaje
              </CardTitle>
              <CardDescription className="mt-1">
                Objetivos que alcanzarás al completar este curso
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {course.learning_outcomes.map((outcome, index) => (
                <li key={outcome.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5 overflow-hidden">
                    <span className="text-xs font-medium text-primary">
                      RA{index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">
                      <ExpandableText text={outcome.description} />
                    </p>
                    {outcome.bloom_level && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {outcome.bloom_level}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Módulos y Contenido */}
      <Card className="border-slate-200">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <BookOpen className="h-5 w-5 text-primary" />
              Contenido del Curso
            </CardTitle>
            <CardDescription className="mt-1">
              Explora los módulos y materiales del curso
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {course.modules.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {course.modules.map((module) => (
                <AccordionItem
                  key={module.id}
                  value={`module-${module.id}`}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="text-left flex-1">
                        <h4 className="font-semibold text-slate-900">
                          {module.title}
                        </h4>
                        {module.description && (
                          <p className="text-sm text-slate-600 mt-1">
                            <ExpandableText
                              text={module.description}
                              maxLength={120}
                            />
                          </p>
                        )}
                        {module.objectives.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs font-medium text-slate-500 mb-2">
                              Objetivos del módulo:
                            </p>
                            <ul className="space-y-1.5">
                              {module.objectives.map((obj) => (
                                <li
                                  key={obj.id}
                                  className="flex items-start gap-2 text-xs text-slate-700"
                                >
                                  <span className="text-primary mt-0.5">•</span>
                                  <span className="flex-1">
                                    {obj.description}
                                  </span>
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
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm text-slate-900">
                          Temas ({module.topics.length})
                        </h5>
                      </div>

                      {module.topics.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-6 bg-white rounded-lg border border-slate-200">
                          No hay temas disponibles en este módulo
                        </p>
                      ) : (
                        <Accordion
                          type="single"
                          collapsible
                          className="space-y-3"
                        >
                          {module.topics.map((topic) => (
                            <AccordionItem
                              key={topic.id}
                              value={`topic-${topic.id}`}
                              className="border-none"
                            >
                              <div className="bg-white border-l-4 border-l-slate-900 rounded-lg shadow-sm overflow-hidden">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors">
                                  <div className="text-left flex-1">
                                    <h5 className="font-semibold text-slate-900">
                                      {topic.title}
                                    </h5>
                                    {topic.description && (
                                      <p className="text-sm text-slate-600 mt-1">
                                        <ExpandableText
                                          text={topic.description}
                                          maxLength={100}
                                        />
                                      </p>
                                    )}
                                    {topic.objectives.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {topic.objectives.map((obj) => (
                                          <Badge
                                            key={obj.id}
                                            variant="secondary"
                                            className="text-xs bg-slate-100 text-slate-700"
                                          >
                                            {obj.code
                                              ? `${obj.code}: ${obj.description}`
                                              : obj.description}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </AccordionTrigger>

                                <AccordionContent className="px-4 pb-4 bg-slate-50/30">
                                  <div className="space-y-4 pt-2">
                                    {/* Recursos */}
                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                      <h6 className="text-sm font-semibold text-slate-900 mb-3">
                                        Recursos ({topic.resources.length})
                                      </h6>

                                      {topic.resources.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                                          No hay recursos disponibles
                                        </p>
                                      ) : (
                                        <div className="space-y-2">
                                          {topic.resources.map((resource) => (
                                            <div
                                              key={resource.id}
                                              className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:shadow-sm hover:border-slate-300 transition-all"
                                            >
                                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <ResourceIcon
                                                  type={resource.type}
                                                />
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                  <span className="font-medium text-sm text-slate-900 truncate">
                                                    {resource.title}
                                                  </span>
                                                  {resource.duration_minutes && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                                                      <Clock className="h-3 w-3" />
                                                      {
                                                        resource.duration_minutes
                                                      }{" "}
                                                      min
                                                    </div>
                                                  )}
                                                </div>
                                                {resource.is_mandatory && (
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-xs bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0"
                                                  >
                                                    Obligatorio
                                                  </Badge>
                                                )}
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="ml-2 flex-shrink-0"
                                                asChild
                                              >
                                                <a
                                                  href={resource.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  Abrir
                                                  <ExternalLink className="h-3 w-3 ml-1" />
                                                </a>
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Quizzes */}
                                    <div className="bg-blue-50/50 rounded-lg border border-blue-200 p-4">
                                      <h6 className="text-sm font-semibold text-slate-900 mb-3">
                                        Quizzes ({topic.quizzes.length})
                                      </h6>

                                      {topic.quizzes.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-4 bg-white/60 rounded-lg">
                                          No hay evaluaciones disponibles
                                        </p>
                                      ) : (
                                        <div className="space-y-2">
                                          {topic.quizzes.map((quiz) => (
                                            <div
                                              key={quiz.id}
                                              className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg hover:shadow-sm transition-all"
                                            >
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <BookOpen className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                                <span className="font-medium text-sm text-slate-900 truncate">
                                                  {quiz.title}
                                                </span>
                                                {quiz.time_minutes && (
                                                  <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                                                    <Timer className="h-3 w-3" />
                                                    {quiz.time_minutes} min
                                                  </div>
                                                )}
                                                {/* ← AGREGAR BADGE DE COMPLETADO */}
                                                {quiz.completed &&
                                                  quiz.last_attempt_percent !==
                                                    undefined && (
                                                    <Badge
                                                      variant={
                                                        quiz.last_attempt_percent >=
                                                        70
                                                          ? "default"
                                                          : "secondary"
                                                      }
                                                      className="flex-shrink-0 ml-2"
                                                    >
                                                      {quiz.last_attempt_percent.toFixed(
                                                        0
                                                      )}
                                                      %
                                                    </Badge>
                                                  )}
                                              </div>

                                              {/* ← CAMBIAR BOTÓN SEGÚN completed */}
                                              {quiz.completed &&
                                              quiz.last_attempt_id ? (
                                                <Link
                                                  href={`/curso/${course.id}/quiz/${quiz.id}/resultados`}
                                                >
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="ml-2 flex-shrink-0"
                                                  >
                                                    Ver Resultados
                                                  </Button>
                                                </Link>
                                              ) : (
                                                <Link
                                                  href={`/curso/${course.id}/quiz/${quiz.id}`}
                                                >
                                                  <Button
                                                    size="sm"
                                                    className="ml-2 flex-shrink-0"
                                                  >
                                                    Realizar Quiz
                                                  </Button>
                                                </Link>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </AccordionContent>
                              </div>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Aún no hay contenido
              </h3>
              <p className="text-slate-600 text-sm">
                El docente aún no ha publicado el contenido del curso
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
