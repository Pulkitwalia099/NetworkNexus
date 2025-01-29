import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import ContactCard from "@/components/contacts/contact-card";
import ContactForm from "@/components/contacts/contact-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Download, Upload, FileJson, FileSpreadsheet } from "lucide-react";
import { Contact } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts", search],
    queryFn: async () => {
      const url = search
        ? `/api/contacts?search=${encodeURIComponent(search)}`
        : "/api/contacts";
      const response = await fetch(url);
      return response.json();
    },
  });

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

  const importMutation = useMutation({
    mutationFn: async (data: { content: string, format: 'json' | 'csv' }) => {
      const response = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to import contacts");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contacts imported successfully" });
      setIsImportOpen(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to import contacts",
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
        await importMutation.mutateAsync({ content, format });
      } catch (error) {
        console.error('Import error:', error);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div>
      <Header 
        title="Contacts" 
        action={{
          label: "Add Contact",
          onClick: handleAddNew
        }}
        extraButtons={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleExport('json')}
              title="Export as JSON"
            >
              <FileJson className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleExport('csv')}
              title="Export as CSV"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsImportOpen(true)}
              title="Import Contacts"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <div className="w-64 mb-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contacts?.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onClick={() => handleEdit(contact)}
              />
            ))}
          </div>
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
      />
      </div>
    </div>
  );
}