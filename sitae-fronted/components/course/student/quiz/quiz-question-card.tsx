// components/course/student/quiz/quiz-question-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  score: number;
  options: QuizOption[];
}

interface QuizQuestionCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  isAnswered: boolean;
}

export function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onSelectOption,
  isAnswered,
}: QuizQuestionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="font-mono">
                {questionNumber}/{totalQuestions}
              </Badge>
              <Badge variant="secondary">{question.score} pts</Badge>
              {isAnswered && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Respondida
                </Badge>
              )}
            </div>
            <p className="text-base font-normal mt-2">{question.text}</p>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedOptionId || undefined}
          onValueChange={onSelectOption}
        >
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div
                key={option.id}
                className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                  selectedOptionId === option.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value={option.id} id={option.id} className="mt-0.5" />
                <Label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer text-sm leading-relaxed"
                >
                  <span className="font-medium mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}