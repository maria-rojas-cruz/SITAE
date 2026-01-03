// app/curso/[id]/quiz/[quizId]/_components/QuestionCard.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { api } from "@/lib/api-client";

interface QuestionCardProps {
  question: any;
  questionNumber: number;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  onClear: () => void;
}

export default function QuestionCard({
  question,
  questionNumber,
  selectedOptionId,
  onSelect,
  onClear,
}: QuestionCardProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOptions();
  }, [question.id]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const { options } = await api.get(`api/questions/${question.id}/options`);
      setOptions(options || []);
    } catch (err) {
      console.error("Error loading options:", err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={selectedOptionId ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            Pregunta {questionNumber}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({question.score} pts)
            </span>
          </CardTitle>
          {selectedOptionId && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              ✓ Respondida
            </span>
          )}
        </div>
        <CardDescription className="text-base leading-relaxed mt-2 whitespace-pre-line">
          {question.text.replace(/\\n/g, "\n")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedOptionId || ""} onValueChange={onSelect}>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div
                key={option.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedOptionId === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                }`}
              >
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer leading-relaxed"
                >
                  <span className="font-semibold mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        {selectedOptionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="mt-4 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar respuesta
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
