import { Task } from "@db/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onToggle?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

const priorityColors = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-green-500",
};

export default function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg group"
        >
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() => onToggle?.(task)}
          />
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium",
              task.status === "completed" && "line-through text-muted-foreground"
            )}>
              {task.title}
            </p>
            {task.dueDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Due {format(new Date(task.dueDate), "PPp")}
              </p>
            )}
          </div>
          <span className={cn(
            "text-xs font-medium",
            priorityColors[task.priority as keyof typeof priorityColors]
          )}>
            {task.priority}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}