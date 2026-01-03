import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiskAnalysisTable } from "./risk-analysis-table";
import type { StudentPerformance, RiskFilter } from "../types";

interface RiskTabProps {
  students: StudentPerformance[];
  riskFilter: RiskFilter;
  onRiskFilterChange: (value: RiskFilter) => void;
}

export function RiskTab({
  students,
  riskFilter,
  onRiskFilterChange,
}: RiskTabProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">
          Análisis de Riesgo Estudiantil
        </CardTitle>
        <CardDescription className="text-slate-600">
          <div className="flex gap-2 mt-2">
            <Select value={riskFilter} onValueChange={onRiskFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar estudiantes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estudiantes</SelectItem>
                <SelectItem value="desaprobados">Desaprobados</SelectItem>
                <SelectItem value="no_participan">No participan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RiskAnalysisTable students={students} />
      </CardContent>
    </Card>
  );
}