import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProfileData } from "../types";

interface AcademicProfileTabProps {
  profileData: ProfileData;
  onUpdateField: (field: keyof ProfileData, value: any) => void;
  onCheckboxChange: (
    field: keyof ProfileData,
    value: string,
    checked: boolean
  ) => void;
}

export function AcademicProfileTab({
  profileData,
  onUpdateField,
  onCheckboxChange,
}: AcademicProfileTabProps) {
  const interests = [
    { id: "peru_latam", label: "Datos de Perú/LatAm" },
    { id: "finanzas", label: "Finanzas" },
    { id: "salud", label: "Salud" },
    { id: "medio_ambiente", label: "Medio ambiente" },
    { id: "retail", label: "Retail" },
    { id: "gobierno", label: "Gobierno" },
    { id: "tecnologia", label: "Tecnología" },
    { id: "educacion", label: "Educación" },
  ];

  const devices = [
    { id: "laptop_pc", label: "Laptop/PC" },
    { id: "tablet", label: "Tablet" },
    { id: "movil", label: "Móvil" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil Académico</CardTitle>
        <CardDescription>
          Esta información se aplicará a todos tus cursos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Carrera */}
        <div className="space-y-2">
          <Label htmlFor="career">
            1. Carrera o área de formación profesional
          </Label>
          <Input
            id="career"
            placeholder="Ej: Ingeniería de Sistemas"
            value={profileData.career}
            onChange={(e) => onUpdateField("career", e.target.value)}
          />
        </div>

        {/* Puesto actual */}
        <div className="space-y-2">
          <Label htmlFor="job_role">2. Puesto actual que desempeñas</Label>
          <Input
            id="job_role"
            placeholder="Ej: Desarrollador Junior, Estudiante, etc."
            value={profileData.job_role}
            onChange={(e) => onUpdateField("job_role", e.target.value)}
          />
        </div>

        {/* Forma de aprendizaje */}
        <div className="space-y-3">
          <Label>3. Forma de aprendizaje preferida</Label>
          <RadioGroup
            value={profileData.preferred_modalities?.[0] || ""}
            onValueChange={(value) =>
              onUpdateField("preferred_modalities", value ? [value] : [])
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id="video" />
              <Label htmlFor="video">Viendo videos o ejemplos prácticos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lectura" id="lectura" />
              <Label htmlFor="lectura">Leyendo textos o documentos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ejercicio" id="ejercicio" />
              <Label htmlFor="ejercicio">Resolviendo ejercicios prácticos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="conversacion" id="conversacion" />
              <Label htmlFor="conversacion">
                Conversando o preguntando en clase/asistente
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Intereses */}
        <div className="space-y-3">
          <Label>4. ¿Qué temas te interesan para los ejemplos y casos?</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {interests.map((interest) => (
              <div key={interest.id} className="flex items-center space-x-2">
                <Checkbox
                  id={interest.id}
                  checked={profileData.interests.includes(interest.id)}
                  onCheckedChange={(checked) =>
                    onCheckboxChange("interests", interest.id, checked as boolean)
                  }
                />
                <Label htmlFor={interest.id}>{interest.label}</Label>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Otro (especifica)"
              value={profileData.interest_other}
              onChange={(e) => onUpdateField("interest_other", e.target.value)}
            />
          </div>
        </div>

        {/* Dispositivos */}
        <div className="space-y-3">
          <Label>5. ¿Con qué dispositivos y conectividad cuentas?</Label>
          <div className="space-y-2">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center space-x-2">
                <Checkbox
                  id={device.id}
                  checked={profileData.devices.includes(device.id)}
                  onCheckedChange={(checked) =>
                    onCheckboxChange("devices", device.id, checked as boolean)
                  }
                />
                <Label htmlFor={device.id}>{device.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}