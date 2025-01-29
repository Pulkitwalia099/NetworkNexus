import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import ContactCard from "@/components/contacts/contact-card";
import ContactForm from "@/components/contacts/contact-form";
import GroupManagementDialog from "@/components/contacts/group-management-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Download, Upload, FileJson, FileSpreadsheet, Tags, Users2 } from "lucide-react";
import { Contact } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import ContactDetail from "@/components/contacts/contact-detail";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts", search],
    queryFn: async () => {
      const url = search
        ? `/api/contacts?search=${encodeURIComponent(search)}`
        : "/api/contacts";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      return response.json();
    },
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

  // Filter and group contacts based on search and selected tags
  const filteredAndGroupedContacts = useMemo(() => {
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

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedContact(undefined);
    setIsFormOpen(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailOpen(true);
  };

  const handleDelete = () => {
    if (selectedContact) {
      deleteMutation.mutate(selectedContact.id);
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
          onClick: handleAddNew
        }}
        extraButtons={
          <motion.div 
            className="flex items-center space-x-3"
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
          </motion.div>
        }
      />

      <div className="px-6 py-8 max-w-7xl mx-auto">
        <motion.div 
          className="w-full max-w-md mx-auto mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-background/50 backdrop-blur-sm border-border/50 rounded-full"
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="h-32 bg-accent/20 animate-pulse rounded-xl backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              />
            ))}
          </div>
        ) : (
          <>
            <AnimatePresence>
              {selectedTags.length > 0 && (
                <motion.div 
                  className="mb-6 flex flex-wrap gap-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {selectedTags.map(tag => (
                    <motion.span
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
                    </motion.span>
                  ))}
                  {selectedTags.length > 1 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {filteredAndGroupedContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                  >
                    <ContactCard
                      contact={contact}
                      onClick={() => handleViewContact(contact)}
                      onEdit={() => handleEdit(contact)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredAndGroupedContacts.length === 0 && (
              <motion.div 
                className="text-center mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-muted-foreground">
                  No contacts found {selectedTags.length > 0 && "with selected tags"}
                </p>
              </motion.div>
            )}
          </>
        )}

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Contacts</DialogTitle>
              <DialogDescription>
                Upload a JSON or CSV file containing contact information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: JSON, CSV
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <ContactForm
          contact={selectedContact}
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          onDelete={selectedContact ? handleDelete : undefined}
        />

        {selectedContact && (
          <ContactDetail
            contact={selectedContact}
            open={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
          />
        )}
        <GroupManagementDialog
          open={isGroupManagementOpen}
          onOpenChange={setIsGroupManagementOpen}
          existingGroups={allGroups}
        />
      </div>
    </div>
  );
}