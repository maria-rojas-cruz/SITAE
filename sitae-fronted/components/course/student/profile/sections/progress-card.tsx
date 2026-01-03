import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ProgressCardProps {
  completeness: number;
}

export function ProgressCard({ completeness }: ProgressCardProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Tu perfil está al {completeness}% completado
          </span>
          {completeness === 100 && (
            <Badge className="bg-green-600">Completo</Badge>
          )}
        </div>
        <Progress value={completeness} className="h-2" />
      </CardContent>
    </Card>
  );
}