import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Meeting, Contact } from '@db/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import MeetingForm from './meeting-form';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  extendedProps: {
    description?: string;
    contactId?: number;
    type: 'meeting' | 'follow-up';
    status?: string;
  };
}

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch meetings and contacts
  const { data: meetings } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Convert meetings to calendar events
  const events: CalendarEvent[] = meetings?.map((meeting) => ({
    id: `meeting-${meeting.id}`,
    title: meeting.title,
    start: meeting.date,
    end: meeting.date,
    extendedProps: {
      description: meeting.description,
      contactId: meeting.contactId,
      type: 'meeting',
      status: meeting.status,
    },
  })) ?? [];

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: async (data: Partial<Meeting>) => {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      toast({ title: 'Meeting scheduled successfully' });
      setIsFormOpen(false);
    },
  });

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date);
    setIsFormOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const event = arg.event;
    if (event.extendedProps.type === 'meeting') {
      // Handle meeting click
      toast({ title: `Meeting: ${event.title}` });
    }
  };

  return (
    <div className="p-4">
      <div className="rounded-lg border bg-card">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          editable={true}
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
          </DialogHeader>
          <MeetingForm
            date={selectedDate}
            contacts={contacts ?? []}
            onSubmit={(data) => createMeetingMutation.mutate(data)}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
