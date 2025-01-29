import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contact, ContactConnection } from "@db/schema";
import { z } from "zod";
import { X } from "lucide-react";
import { useState } from "react";

const connectionSchema = z.object({
  sourceContactId: z.number(),
  targetContactId: z.number(),
  relationshipType: z.string().min(1, "Relationship type is required"),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().or(z.literal("")),
  strength: z.number().min(1).max(5),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface ConnectionFormProps {
  sourceContact: Contact;
  availableContacts: Contact[];
  connection?: ContactConnection;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ContactConnection>) => void;
}

export default function ConnectionForm({ 
  sourceContact, 
  availableContacts, 
  connection, 
  open, 
  onClose, 
  onSubmit 
}: ConnectionFormProps) {
  const form = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      sourceContactId: sourceContact.id,
      targetContactId: connection?.targetContactId ?? availableContacts[0]?.id,
      relationshipType: connection?.relationshipType ?? "",
      tags: connection?.tags as string[] ?? [],
      notes: connection?.notes ?? "",
      strength: connection?.strength ?? 3,
    },
  });

  const [newTag, setNewTag] = useState("");

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      const currentTags = form.getValues("tags");
      if (!currentTags.includes(newTag.trim())) {
        form.setValue("tags", [...currentTags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {connection ? "Edit Connection" : "New Connection"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetContactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connected Contact</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableContacts
                        .filter(contact => contact.id !== sourceContact.id)
                        .map(contact => (
                          <SelectItem key={contact.id} value={contact.id.toString()}>
                            {contact.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationshipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="mentee">Mentee</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Strength (1-5)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select strength" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <SelectItem key={value} value={value.toString()}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Tags</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        placeholder="Add tags (press Enter)"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                      />
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tag) => (
                          <span
                            key={tag}
                            className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {connection ? "Update Connection" : "Create Connection"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
