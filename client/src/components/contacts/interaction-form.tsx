import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Interaction } from "@db/schema";

const interactionSchema = z.object({
  type: z.enum(['note', 'email', 'call', 'meeting']),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  outcome: z.string().optional(),
  createTask: z.boolean().default(false),
  taskTitle: z.string().optional(),
  taskDueDate: z.string().optional(),
  taskPriority: z.enum(['low', 'medium', 'high']).optional(),
}).refine((data) => {
  if (data.createTask) {
    return data.taskTitle && data.taskDueDate && data.taskPriority;
  }
  return true;
}, {
  message: "Task details are required when creating a follow-up task",
  path: ["taskTitle"],
});

type InteractionFormData = z.infer<typeof interactionSchema>;

interface InteractionFormProps {
  interaction?: Interaction;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InteractionFormData) => void;
  mode?: 'create' | 'edit';
}

export default function InteractionForm({ interaction, open, onClose, onSubmit, mode = 'create' }: InteractionFormProps) {
  const [showTaskFields, setShowTaskFields] = useState(false);

  const form = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: 'note',
      title: '',
      description: '',
      outcome: '',
      createTask: false,
      taskTitle: '',
      taskDueDate: '',
      taskPriority: 'medium',
    },
  });

  // Reset form when interaction changes
  useEffect(() => {
    if (interaction && mode === 'edit') {
      form.reset({
        type: interaction.type as any,
        title: interaction.title,
        description: interaction.description || '',
        outcome: interaction.outcome || '',
        createTask: false,
      });
    }
  }, [interaction, mode, form]);

  const handleSubmit = (data: InteractionFormData) => {
    onSubmit(data);
    form.reset();
    setShowTaskFields(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add' : 'Edit'} Interaction</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter interaction title" />
                  </FormControl>
                  <FormMessage />
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
                    <Textarea {...field} placeholder="Enter interaction details" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter interaction outcome" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <div className="border rounded-lg p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="createTask"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setShowTaskFields(!!checked);
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Create Follow-up Task</FormLabel>
                        <FormDescription>
                          Create a task based on this interaction
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {showTaskFields && (
                  <div className="space-y-4 pl-7">
                    <FormField
                      control={form.control}
                      name="taskTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Follow up on..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taskDueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taskPriority"
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{mode === 'create' ? 'Add' : 'Save'} Interaction</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}