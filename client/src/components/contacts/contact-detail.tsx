import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact, Interaction } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Phone, Building2, Briefcase, Users, Tag } from "lucide-react";
import InteractionList from "./interaction-list";
import InteractionForm from "./interaction-form";

interface ContactDetailProps {
  contact: Contact;
  open: boolean;
  onClose: () => void;
}

export default function ContactDetail({ contact, open, onClose }: ContactDetailProps) {
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: interactions } = useQuery<Interaction[]>({
    queryKey: [`/api/contacts/${contact.id}/interactions`],
    enabled: open,
  });

  const createInteractionMutation = useMutation({
    mutationFn: async (data: Partial<Interaction>) => {
      const response = await fetch(`/api/contacts/${contact.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/contacts/${contact.id}/interactions`] 
      });
      toast({ title: "Interaction added successfully" });
      setIsInteractionFormOpen(false);
    },
  });

  const handleAddInteraction = (data: any) => {
    createInteractionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="grid gap-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{contact.name}</h2>
              <div className="mt-2 space-y-1">
                {contact.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4" />
                    {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="mr-2 h-4 w-4" />
                    {contact.phone}
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building2 className="mr-2 h-4 w-4" />
                    {contact.company}
                  </div>
                )}
                {contact.title && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Briefcase className="mr-2 h-4 w-4" />
                    {contact.title}
                  </div>
                )}
                {contact.group && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    {contact.group}
                  </div>
                )}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Tag className="mr-2 h-4 w-4" />
                    <div className="flex flex-wrap gap-1">
                      {(contact.tags as string[]).map((tag) => (
                        <span
                          key={tag}
                          className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={() => setIsInteractionFormOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Add Interaction
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Interaction History</h3>
            {interactions?.length ? (
              <InteractionList interactions={interactions} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No interactions recorded yet.
              </p>
            )}
          </div>
        </div>

        <InteractionForm
          open={isInteractionFormOpen}
          onClose={() => setIsInteractionFormOpen(false)}
          onSubmit={handleAddInteraction}
        />
      </DialogContent>
    </Dialog>
  );
}