import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, X } from "lucide-react";

export interface WidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}

export default function Widget({ id, title, children, onRemove, className = "" }: WidgetProps) {
  return (
    <Card className={`relative ${className}`}>
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" data-drag-handle />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="p-4">
        {children}
      </div>
    </Card>
  );
}
