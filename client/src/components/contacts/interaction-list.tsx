import { format } from "date-fns";
import { Interaction } from "@db/schema";
import { MessageSquare, Mail, Phone, Calendar } from "lucide-react";

const icons = {
  note: MessageSquare,
  email: Mail,
  call: Phone,
  meeting: Calendar,
};

interface InteractionListProps {
  interactions: Interaction[];
}

export default function InteractionList({ interactions }: InteractionListProps) {
  return (
    <div className="space-y-4">
      {interactions.map((interaction) => {
        const Icon = icons[interaction.type as keyof typeof icons] || MessageSquare;
        
        return (
          <div
            key={interaction.id}
            className="flex items-start space-x-4 p-4 rounded-lg border bg-card"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium">
                  {interaction.title}
                </p>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(interaction.date), "PPp")}
                </span>
              </div>
              {interaction.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {interaction.description}
                </p>
              )}
              {interaction.outcome && (
                <p className="mt-2 text-sm font-medium text-primary">
                  Outcome: {interaction.outcome}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
