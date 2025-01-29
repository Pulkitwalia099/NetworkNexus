import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Contact, Interaction } from "@db/schema";
import { MessageSquare, PencilIcon, Mail, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import QuickInteractionForm from "./quick-interaction-form";
import { motion } from "framer-motion";

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  onEdit?: () => void;
}

// Create reusable motion components
const MotionCard = motion.create(Card);
const MotionDiv = motion.create("div");

export default function ContactCard({ contact, onClick, onEdit }: ContactCardProps) {
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Motion config
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    hover: { scale: 1.02 },
  };

  // Rest of the component implementation remains the same, just update JSX...
  const createInteractionMutation = useMutation({
    mutationFn: async (data: Partial<Interaction> & { createTask?: boolean; taskTitle?: string; taskDueDate?: string; taskPriority?: string }) => {
      const response = await fetch(`/api/contacts/${contact.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          task: data.createTask ? {
            title: data.taskTitle,
            dueDate: data.taskDueDate,
            priority: data.taskPriority,
            category: 'follow-up',
            contactId: contact.id,
            tags: [] as string[],
          } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create interaction");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contact.id}/interactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contact.id}/tasks`] });
      toast({ title: "Interaction added successfully" });
      setIsQuickFormOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create interaction", variant: "destructive" });
    },
  });

  const handleQuickInteraction = (data: Partial<Interaction> & { createTask?: boolean; taskTitle?: string; taskDueDate?: string; taskPriority?: string }) => {
    createInteractionMutation.mutate(data);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && 
        (e.target.closest('button') || e.target.closest('[role="dialog"]'))) {
      return;
    }
    onClick?.();
  };

  return (
    <MotionCard 
      className="p-4 md:p-6 hover:bg-accent/5 cursor-pointer relative group backdrop-blur-sm bg-background/50 border-border/50 rounded-xl transition-colors overflow-hidden touch-pan-y"
      onClick={handleCardClick}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start space-x-4">
        <Avatar className="h-12 w-12 ring-2 ring-primary/10 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary/20">
          <AvatarImage src={contact.avatar || undefined} alt={`${contact.name}'s avatar`} />
          <AvatarFallback className="bg-primary/5 text-primary font-medium">
            {contact.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground/90 tracking-tight truncate">
              {contact.name}
            </p>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 md:hidden" />
          </div>
          {contact.title && (
            <div className="flex items-center text-sm text-muted-foreground/70 space-x-1">
              <span className="truncate">{contact.title}</span>
              {contact.company && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="truncate">{contact.company}</span>
                </>
              )}
            </div>
          )}
          {contact.email && (
            <div className="flex items-center text-sm text-muted-foreground/60 space-x-1">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {Array.isArray(contact.tags) && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {contact.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/5 text-primary/70 border border-primary/10"
                >
                  {tag}
                </span>
              ))}
              {contact.tags.length > 3 && (
                <span className="text-xs text-muted-foreground/50">
                  +{contact.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <MotionDiv 
          className="hidden md:flex space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="h-8 w-8 hover:bg-primary/5 transition-colors"
            aria-label="Edit contact"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Popover open={isQuickFormOpen} onOpenChange={setIsQuickFormOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/5 transition-colors"
                onClick={(e) => e.stopPropagation()}
                aria-label="Quick interaction"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 backdrop-blur-lg" onClick={(e) => e.stopPropagation()}>
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
        </MotionDiv>
      </div>
    </MotionCard>
  );
}