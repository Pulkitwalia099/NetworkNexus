import { Card } from "@/components/ui/card";
import { Users, Calendar, CheckSquare, CheckCircle } from "lucide-react";

const icons = {
  users: Users,
  calendar: Calendar,
  "check-square": CheckSquare,
  "check-circle": CheckCircle,
};

interface StatsCardProps {
  title: string;
  value: number;
  icon: keyof typeof icons;
}

export default function StatsCard({ title, value, icon }: StatsCardProps) {
  const Icon = icons[icon];

  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-semibold">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}
