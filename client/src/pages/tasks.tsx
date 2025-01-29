import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import TaskList from "@/components/tasks/task-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { Task } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
}

export default function Tasks() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const form = useForm<TaskFormData>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      category: "general",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (task: TaskFormData) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created successfully" });
      setIsFormOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully" });
      setIsFormOpen(false);
      setSelectedTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted successfully" });
      setIsDeleteDialogOpen(false);
      setSelectedTask(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (task: Task) => {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          status: task.status === "completed" ? "pending" : "completed",
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    if (selectedTask) {
      updateMutation.mutate({ ...data, id: selectedTask.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    form.reset({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      category: task.category,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTask) {
      deleteMutation.mutate(selectedTask.id);
    }
  };

  return (
    <div>
      <Header 
        title="Tasks" 
        action={{
          label: "Add Task",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => {
            setSelectedTask(null);
            form.reset();
            setIsFormOpen(true);
          }
        }}
      />

      <div className="p-6">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Manage your tasks and track progress
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : (
          <TaskList 
            tasks={tasks || []} 
            onToggle={(task) => toggleMutation.mutate(task)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTask ? 'Edit' : 'Create New'} Task</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{selectedTask ? 'Save' : 'Create'} Task</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this task? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}