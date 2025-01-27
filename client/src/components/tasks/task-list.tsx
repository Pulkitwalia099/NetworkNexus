import { Task } from "@db/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TaskListProps {
  tasks: Task[];
  onToggle?: (task: Task) => void;
}

const priorityColors = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-green-500",
};

export default function TaskList({ tasks, onToggle }: TaskListProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg"
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
              <p className="text-xs text-muted-foreground">
                Due {format(new Date(task.dueDate), "PPP")}
              </p>
            )}
          </div>
          <span className={cn(
            "text-xs font-medium",
            priorityColors[task.priority as keyof typeof priorityColors]
          )}>
            {task.priority}
          </span>
        </div>
      ))}
    </div>
  );
}
