import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MeetingCard from "@/components/meetings/meeting-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Meeting, Contact } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import MeetingForm from "@/components/calendar/meeting-form";

export default function Meetings() {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Meeting>) => {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: "Meeting scheduled successfully" });
      setIsFormOpen(false);
      setSelectedMeeting(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Meeting>) => {
      const response = await fetch(`/api/meetings/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: "Meeting updated successfully" });
      setIsFormOpen(false);
      setSelectedMeeting(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: "Meeting deleted successfully" });
      setSelectedMeeting(null);
    },
  });

  const handleSubmit = (data: Partial<Meeting>) => {
    if (selectedMeeting) {
      updateMutation.mutate({ ...data, id: selectedMeeting.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsFormOpen(true);
  };

  const handleDelete = (meeting: Meeting) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      deleteMutation.mutate(meeting.id);
    }
  };

  const handleAddNew = () => {
    setSelectedMeeting(null);
    setIsFormOpen(true);
  };

  const getContactForMeeting = (meeting: Meeting) => {
    return contacts?.find(contact => contact.id === meeting.contactId);
  };

  return (
    <div>
      <Header 
        title="Meetings" 
        action={{
          label: "Schedule Meeting",
          onClick: handleAddNew
        }}
      />

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meetings?.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                contact={getContactForMeeting(meeting)}
                onEdit={() => handleEdit(meeting)}
                onDelete={() => handleDelete(meeting)}
              />
            ))}
            {meetings?.length === 0 && (
              <p className="text-center text-muted-foreground col-span-full mt-8">
                No meetings scheduled
              </p>
            )}
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
              </DialogTitle>
            </DialogHeader>
            <MeetingForm
              date={selectedMeeting ? new Date(selectedMeeting.date) : new Date()}
              contacts={contacts ?? []}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedMeeting(null);
              }}
              meeting={selectedMeeting}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}