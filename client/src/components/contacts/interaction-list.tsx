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
    <div className="relative space-y-0">
      {interactions.map((interaction, index) => {
        const Icon = icons[interaction.type as keyof typeof icons] || MessageSquare;

        return (
          <div key={interaction.id} className="relative pl-8 pb-8">
            {/* Timeline connector */}
            {index < interactions.length - 1 && (
              <div className="absolute left-[1.1875rem] top-10 bottom-0 w-px bg-border" />
            )}

            <div className="relative">
              {/* Timeline node */}
              <div className="absolute left-[-2rem] p-1 rounded-full bg-background border-2 border-primary">
                <Icon className="h-4 w-4 text-primary" />
              </div>

              {/* Content */}
              <div className="bg-card rounded-lg border p-4">
                <div className="flex justify-between items-start gap-x-2">
                  <div>
                    <p className="font-medium">
                      {interaction.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(interaction.date), "PPp")}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary capitalize">
                    {interaction.type}
                  </span>
                </div>

                {interaction.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {interaction.description}
                  </p>
                )}

                {interaction.outcome && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm">
                      <span className="font-medium text-primary">Outcome:</span>{" "}
                      {interaction.outcome}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}