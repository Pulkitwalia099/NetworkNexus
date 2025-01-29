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
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  onEdit?: () => void;
}

const MotionCard = motion(Card);

export default function ContactCard({ contact, onClick, onEdit }: ContactCardProps) {
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Motion values for swipe gesture
  const x = useMotionValue(0);
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);
  const rotate = useTransform(x, [-100, 0, 100], [-5, 0, 5]);

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

  const handleDragEnd = (_: Event, info: PanInfo) => {
    const threshold = 50;
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) {
        // Swipe right - View details
        onClick?.();
      } else {
        // Swipe left - Edit
        onEdit?.();
      }
    }
    x.set(0);
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
      style={{ x, scale, opacity, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start space-x-4">
        <Avatar className="h-12 w-12 ring-2 ring-primary/10 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary/20">
          <AvatarImage src={contact.avatar || undefined} />
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
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(contact.tags as string[]).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/5 text-primary/70 border border-primary/10"
                >
                  {tag}
                </span>
              ))}
              {(contact.tags as string[]).length > 3 && (
                <span className="text-xs text-muted-foreground/50">
                  +{(contact.tags as string[]).length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <motion.div 
          className="hidden md:flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
        </motion.div>
      </div>

      {/* Mobile swipe indicators */}
      <motion.div 
        className="absolute inset-y-0 left-0 w-1 bg-destructive md:hidden"
        style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
      />
      <motion.div 
        className="absolute inset-y-0 right-0 w-1 bg-primary md:hidden"
        style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
      />
    </MotionCard>
  );
}