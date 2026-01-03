import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProfileData } from "../types";

interface CourseProfileTabProps {
  courseName: string;
  profileData: ProfileData;
  onUpdateField: (field: keyof ProfileData, value: any) => void;
  onCheckboxChange: (
    field: keyof ProfileData,
    value: string,
    checked: boolean
  ) => void;
}

export function CourseProfileTab({
  courseName,
  profileData,
  onUpdateField,
  onCheckboxChange,
}: CourseProfileTabProps) {
  const objectives = [
    { id: "mejorar_nota", label: "Mejorar nota / Aprobar" },
    { id: "dominar", label: "Dominar el tema" },
    { id: "aplicar_trabajo", label: "Aplicarlo en el trabajo" },
    { id: "investigacion", label: "Prepararme para investigación" },
    { id: "curiosidad", label: "Curiosidad / actualización" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil del Curso</CardTitle>
        <CardDescription>
          Configuración específica para este curso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nivel de prerrequisitos */}
        <div className="space-y-3">
          <Label>
            1. ¿Cómo evalúas tu nivel en los prerrequisitos del curso?
          </Label>
          <RadioGroup
            value={profileData.prereq_level}
            onValueChange={(value) => onUpdateField("prereq_level", value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="basico" id="basico" />
              <Label htmlFor="basico">Básico</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intermedio" id="intermedio" />
              <Label htmlFor="intermedio">Intermedio</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="avanzado" id="avanzado" />
              <Label htmlFor="avanzado">Avanzado</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Tiempo disponible */}
        <div className="space-y-3">
          <Label>2. Tiempo disponible para el curso por semana</Label>
          <RadioGroup
            value={profileData.weekly_time}
            onValueChange={(value) => onUpdateField("weekly_time", value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="llt3h" id="menos-3" />
              <Label htmlFor="menos-3">Menos de 3 horas</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="h3_6" id="3-6" />
              <Label htmlFor="3-6">Entre 3 y 6 horas</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gt6h" id="mas-6" />
              <Label htmlFor="mas-6">Más de 6 horas</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Objetivos */}
        <div className="space-y-3">
          <Label>3. ¿Cuál es tu objetivo principal al llevar este curso?</Label>
          <div className="space-y-2">
            {objectives.map((objective) => (
              <div key={objective.id} className="flex items-center space-x-2">
                <Checkbox
                  id={objective.id}
                  checked={profileData.goals.includes(objective.id)}
                  onCheckedChange={(checked) =>
                    onCheckboxChange("goals", objective.id, checked as boolean)
                  }
                />
                <Label htmlFor={objective.id}>{objective.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
