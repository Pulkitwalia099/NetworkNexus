import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import ContactList from "@/components/contacts/contact-list";
import ContactForm from "@/components/contacts/contact-form";
import QuickInteractionForm from "@/components/contacts/quick-interaction-form";
import GroupManagementDialog from "@/components/contacts/group-management-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Download, Upload, FileJson, FileSpreadsheet, Tags, Users2, Plus } from "lucide-react";
import { Contact } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import ContactDetail from "@/components/contacts/contact-detail";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQuickInteractionOpen, setIsQuickInteractionOpen] = useState(false);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts", search],
  });

  const { data: interactions } = useQuery({
    queryKey: ["/api/contacts/interactions"],
    enabled: !!contacts?.length,
  });

  const { data: tasks } = useQuery({
    queryKey: ["/api/contacts/tasks"],
    enabled: !!contacts?.length,
  });

  // Extract all unique groups from contacts
  const allGroups = useMemo(() => {
    if (!contacts) return [];
    const groupSet = new Set<string>();
    contacts.forEach(contact => {
      if (contact.group) groupSet.add(contact.group);
    });
    return Array.from(groupSet).sort();
  }, [contacts]);

  // Extract all unique tags from contacts
  const allTags = useMemo(() => {
    if (!contacts) return [];
    const tagSet = new Set<string>();
    contacts.forEach(contact => {
      (contact.tags as string[])?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [contacts]);

  // Filter contacts based on search and selected tags
  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return contacts.filter(contact => {
      const matchesSearch = !search || 
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.email?.toLowerCase().includes(search.toLowerCase()) ||
        contact.company?.toLowerCase().includes(search.toLowerCase());

      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => (contact.tags as string[])?.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [contacts, search, selectedTags]);

  // Group interactions and tasks by contact
  const groupedInteractions = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    if (interactions) {
      interactions.forEach(interaction => {
        if (!grouped[interaction.contactId]) {
          grouped[interaction.contactId] = [];
        }
        grouped[interaction.contactId].push(interaction);
      });
    }
    return grouped;
  }, [interactions]);

  const groupedTasks = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    if (tasks) {
      tasks.forEach(task => {
        if (!grouped[task.contactId]) {
          grouped[task.contactId] = [];
        }
        grouped[task.contactId].push(task);
      });
    }
    return grouped;
  }, [tasks]);

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsFormOpen(true);
  };

  const handleQuickInteraction = (contact: Contact) => {
    setSelectedContact(contact);
    setIsQuickInteractionOpen(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailOpen(true);
  };

  const handleQuickInteractionSubmit = async (data: any) => {
    try {
      // Implement your API call to submit the quick interaction here
      const response = await fetch(`/api/contacts/${selectedContact?.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quick interaction");
      }
      
      toast({ title: "Quick interaction submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/interactions"] });

    } catch (error) {
      toast({ title: "Failed to submit quick interaction", variant: "destructive" });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact created successfully" });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact updated successfully" });
      setIsFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete contact");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact deleted successfully" });
      setIsFormOpen(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to delete contact",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: Partial<Contact>) => {
    if (selectedContact) {
      updateMutation.mutate({ ...data, id: selectedContact.id });
    } else {
      createMutation.mutate(data);
    }
  };


  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/contacts/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ 
        title: "Failed to export contacts",
        variant: "destructive"
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const format = file.name.endsWith('.csv') ? 'csv' : 'json';
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const response = await fetch("/api/contacts/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, format }),
        });
        if (!response.ok) {
          throw new Error("Failed to import contacts");
        }
        await queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
        toast({ title: "Contacts imported successfully" });
        setIsImportOpen(false);
      } catch (error) {
        toast({ 
          title: "Failed to import contacts",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Header 
        title="Contacts" 
        action={{
          label: "Add Contact",
          icon: <Plus className="h-4 w-4 md:mr-2" />,
          onClick: () => {
            setSelectedContact(undefined);
            setIsFormOpen(true);
          },
          className: "fixed bottom-4 right-4 z-50 md:relative md:bottom-0 md:right-0 rounded-full md:rounded-md shadow-lg md:shadow-none"
        }}
        extraButtons={
          <MotionDiv 
            className="hidden md:flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsGroupManagementOpen(true)}
              title="Manage Groups"
              className="hover:bg-primary/5 transition-colors"
            >
              <Users2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-primary/5 transition-colors"
                  title="Filter by tags"
                >
                  <Tags className="h-4 w-4" />
                  {selectedTags.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {selectedTags.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 backdrop-blur-lg">
                {allTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No tags available</p>
                ) : (
                  allTags.map(tag => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        setSelectedTags(prev => 
                          checked 
                            ? [...prev, tag]
                            : prev.filter(t => t !== tag)
                        );
                      }}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="h-4 w-px bg-border/50" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleExport('json')}
              title="Export as JSON"
              className="hover:bg-primary/5 transition-colors"
            >
              <FileJson className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleExport('csv')}
              title="Export as CSV"
              className="hover:bg-primary/5 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsImportOpen(true)}
              title="Import Contacts"
              className="hover:bg-primary/5 transition-colors"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </MotionDiv>
        }
      />

      <div className="px-4 md:px-6 py-4 md:py-8 max-w-7xl mx-auto">
        <MotionDiv 
          className="w-full max-w-md mx-auto mb-6 md:mb-8 sticky top-0 z-10 px-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative bg-background/95 backdrop-blur-sm rounded-full shadow-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-transparent border-border/50 rounded-full"
            />
          </div>
        </MotionDiv>

        <div className="md:hidden flex items-center justify-between mb-4 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsGroupManagementOpen(true)}
            className="flex items-center gap-2"
          >
            <Users2 className="h-4 w-4" />
            Groups
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className="flex items-center gap-2"
          >
            <Tags className="h-4 w-4" />
            Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {selectedTags.length > 0 && (
            <MotionDiv 
              className="mb-4 flex flex-wrap gap-2 px-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {selectedTags.map(tag => (
                <MotionDiv
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/5 text-primary border border-primary/10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {tag}
                  <button
                    onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </MotionDiv>
              ))}
              {selectedTags.length > 1 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </MotionDiv>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <MotionDiv
                key={`skeleton-${i}`}
                className="h-16 bg-accent/20 animate-pulse rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              />
            ))}
          </div>
        ) : (
          <ContactList
            contacts={filteredContacts}
            interactions={groupedInteractions}
            tasks={groupedTasks}
            onEdit={handleEdit}
            onQuickInteraction={handleQuickInteraction}
            onViewDetails={handleViewContact}
          />
        )}

        <ContactForm
          contact={selectedContact}
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          onDelete={selectedContact ? deleteMutation.mutate : undefined}
        />

        {selectedContact && (
          <ContactDetail
            contact={selectedContact}
            open={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
          />
        )}

        {selectedContact && (
          <Dialog open={isQuickInteractionOpen} onOpenChange={setIsQuickInteractionOpen}>
            <DialogContent>
              <QuickInteractionForm
                onSubmit={(data) => {
                  handleQuickInteractionSubmit(data);
                  setIsQuickInteractionOpen(false);
                }}
                onCancel={() => setIsQuickInteractionOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        <GroupManagementDialog
          open={isGroupManagementOpen}
          onOpenChange={setIsGroupManagementOpen}
        />
      </div>
    </div>
  );
}