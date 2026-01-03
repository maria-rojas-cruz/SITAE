// sections/objectives-tab.tsx
import { useState, useMemo } from "react";
import { ErrorAnalysisCard } from "./error-analysis-card";
import { LearningOutcomesCard } from "./learning-outcomes-card";
import { useLearningOutcomes } from "../hooks/useLearningOutcomes";
import type {
  ErrorAnalysis,
  QuizWithMetadata,
  StudentPerformance,
} from "../types";

interface ObjectivesTabProps {
  courseId: string;
  errorAnalysis: ErrorAnalysis[];
  quizzes: QuizWithMetadata[];
  students: StudentPerformance[];
}

// sections/objectives-tab.tsx
// ... (imports igual)

export function ObjectivesTab({
  courseId,
  errorAnalysis,
  quizzes,
  students,
}: ObjectivesTabProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedQuizFilter, setSelectedQuizFilter] = useState<string>("all");

  const { learningOutcomes, isLoading } = useLearningOutcomes(courseId, selectedStudent);

  const filteredLearningOutcomes = useMemo(() => {
    if (selectedTopic === "all") return learningOutcomes;
    return learningOutcomes.filter((lo) => lo.topic === selectedTopic);
  }, [learningOutcomes, selectedTopic]);

  const filteredErrorAnalysis = useMemo(() => {
    if (selectedQuizFilter === "all") return errorAnalysis;
    return errorAnalysis.filter((err) => err.quiz_title === selectedQuizFilter);
  }, [errorAnalysis, selectedQuizFilter]);

  const availableTopics = useMemo(() => {
    return Array.from(
      new Set(learningOutcomes.map((lo) => lo.topic).filter(Boolean))
    );
  }, [learningOutcomes]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ErrorAnalysisCard
        errorAnalysis={filteredErrorAnalysis}
        quizzes={quizzes}
        selectedQuizFilter={selectedQuizFilter}
        onQuizFilterChange={setSelectedQuizFilter}
      />

      <LearningOutcomesCard
        learningOutcomes={filteredLearningOutcomes}
        students={students}
        availableTopics={availableTopics}
        selectedTopic={selectedTopic}
        selectedStudent={selectedStudent}
        isLoading={isLoading} // ← AGREGAR
        onTopicChange={setSelectedTopic}
        onStudentChange={setSelectedStudent}
      />
    </div>
  );
}