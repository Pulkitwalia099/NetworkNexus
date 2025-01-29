import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Contact, Interaction } from "@db/schema";
import { MessageSquare, PencilIcon } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import QuickInteractionForm from "./quick-interaction-form";

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  onEdit?: () => void;
}

export default function ContactCard({ contact, onClick, onEdit }: ContactCardProps) {
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      setIsQuickFormOpen(false);
    },
  });

  const handleQuickInteraction = (data: Partial<Interaction>) => {
    createInteractionMutation.mutate(data);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking the quick interaction button or edit button
    if (e.target instanceof HTMLElement && 
        (e.target.closest('button') || e.target.closest('[role="dialog"]'))) {
      return;
    }
    onClick?.();
  };

  return (
    <Card 
      className="p-4 hover:bg-accent cursor-pointer relative group"
      onClick={handleCardClick}
    >
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={contact.avatar || undefined} />
          <AvatarFallback>
            {contact.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {contact.name}
          </p>
          {contact.title && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {contact.title}
            </p>
          )}
          {contact.company && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {contact.company}
            </p>
          )}
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="hover:bg-background"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Popover open={isQuickFormOpen} onOpenChange={setIsQuickFormOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-background"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Quick Interaction</h4>
                  <p className="text-sm text-muted-foreground">
                    Add a quick interaction with {contact.name}
                  </p>
                </div>
                <QuickInteractionForm
                  onSubmit={handleQuickInteraction}
                  onCancel={() => setIsQuickFormOpen(false)}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
}