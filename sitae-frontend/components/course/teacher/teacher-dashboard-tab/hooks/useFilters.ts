import { useState, useMemo } from "react";
import type {
  StudentPerformance,
  LearningOutcomePerformance,
  ErrorAnalysis,
  RiskFilter,
} from "../types";
import { RISK_THRESHOLDS } from "../constants";

export function useFilters(
  students: StudentPerformance[],
  learningOutcomes: LearningOutcomePerformance[],
  errorAnalysis: ErrorAnalysis[]
) {
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const [selectedQuizForDetails, setSelectedQuizForDetails] = useState<string | null>(
    null
  );
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedQuizFilter, setSelectedQuizFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  const filteredStudents = useMemo(() => {
    if (riskFilter === "desaprobados") {
      return students.filter((student) => (student.avg_score || 0) < RISK_THRESHOLDS.FAILED_SCORE);
    }
    if (riskFilter === "no_participan") {
      return students.filter((student) => {
        const participationRate =
          student.quizzes_total > 0
            ? (student.quizzes_completed / student.quizzes_total) * 100
            : 0;
        return participationRate < RISK_THRESHOLDS.COMPLETION_LOW;
      });
    }
    return students;
  }, [students, riskFilter]);

  const filteredLearningOutcomes = useMemo(() => {
    if (selectedTopic === "all") return learningOutcomes;
    return learningOutcomes.filter((lo) => lo.topic === selectedTopic);
  }, [learningOutcomes, selectedTopic]);

  const filteredErrorAnalysis = useMemo(() => {
    if (selectedQuizFilter === "all") return errorAnalysis;
    return errorAnalysis.filter((error) => error.quiz_title === selectedQuizFilter);
  }, [errorAnalysis, selectedQuizFilter]);

  const availableTopics = useMemo(() => {
    return Array.from(
      new Set(learningOutcomes.map((lo) => lo.topic).filter(Boolean))
    );
  }, [learningOutcomes]);

  return {
    selectedQuiz,
    setSelectedQuiz,
    selectedQuizForDetails,
    setSelectedQuizForDetails,
    selectedTopic,
    setSelectedTopic,
    selectedStudent,
    setSelectedStudent,
    selectedQuizFilter,
    setSelectedQuizFilter,
    riskFilter,
    setRiskFilter,
    filteredStudents,
    filteredLearningOutcomes,
    filteredErrorAnalysis,
    availableTopics,
  };
}