import { Contact, Interaction, Task } from "@db/schema";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MessageSquare, PencilIcon, Phone, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContactListProps {
  contacts: Contact[];
  interactions?: Record<number, Interaction[]>;
  tasks?: Record<number, Task[]>;
  onEdit?: (contact: Contact) => void;
  onQuickInteraction?: (contact: Contact) => void;
  onViewDetails?: (contact: Contact) => void;
}

export default function ContactList({ 
  contacts, 
  interactions = {},
  tasks = {},
  onEdit,
  onQuickInteraction,
  onViewDetails,
}: ContactListProps) {
  const getLastInteraction = (contactId: number) => {
    const contactInteractions = interactions[contactId] || [];
    if (contactInteractions.length === 0) return null;
    
    return contactInteractions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  };

  const getNextTask = (contactId: number) => {
    const contactTasks = tasks[contactId] || [];
    if (contactTasks.length === 0) return null;
    
    return contactTasks
      .filter(task => task.status === "pending")
      .sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )[0];
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground bg-accent/50 rounded-lg">
        <div className="col-span-3">Name</div>
        <div className="col-span-2">Group</div>
        <div className="col-span-2">Phone</div>
        <div className="col-span-2">Last Interaction</div>
        <div className="col-span-2">Follow-up</div>
        <div className="col-span-1">Actions</div>
      </div>
      <AnimatePresence mode="popLayout">
        {contacts.map((contact) => {
          const lastInteraction = getLastInteraction(contact.id);
          const nextTask = getNextTask(contact.id);
          
          return (
            <motion.div
              key={contact.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-accent rounded-lg items-center cursor-pointer group"
              onClick={() => onViewDetails?.(contact)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <div className="col-span-3 font-medium">
                {contact.name}
                {contact.company && (
                  <div className="text-sm text-muted-foreground">
                    {contact.company}
                  </div>
                )}
              </div>
              <div className="col-span-2">
                {contact.group || "-"}
              </div>
              <div className="col-span-2">
                {contact.phone || "-"}
              </div>
              <div className="col-span-2 text-sm">
                {lastInteraction ? (
                  <div>
                    <div className="font-medium">
                      {format(new Date(lastInteraction.date), "MMM d, yyyy")}
                    </div>
                    <div className="text-muted-foreground truncate">
                      {lastInteraction.type}: {lastInteraction.title}
                    </div>
                  </div>
                ) : (
                  "-"
                )}
              </div>
              <div className="col-span-2 text-sm">
                {nextTask ? (
                  <div>
                    <div className="font-medium">
                      {format(new Date(nextTask.dueDate), "MMM d, yyyy")}
                    </div>
                    <div className="text-muted-foreground truncate">
                      {nextTask.title}
                    </div>
                  </div>
                ) : (
                  "-"
                )}
              </div>
              <div className="col-span-1">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickInteraction?.(contact);
                    }}
                    className="h-8 w-8"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(contact);
                    }}
                    className="h-8 w-8"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
