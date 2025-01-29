import { useQuery } from "@tanstack/react-query";
import { Meeting, Contact } from "@db/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Users, MapPin } from "lucide-react";
import { format, isAfter } from "date-fns";
import { Link } from "wouter";

interface UpcomingMeetingItemProps {
  meeting: Meeting;
  contact?: Contact;
}

function UpcomingMeetingItem({ meeting, contact }: UpcomingMeetingItemProps) {
  return (
    <div className="flex items-start space-x-4 py-4">
      <div className="bg-primary/10 rounded-lg p-2">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="font-medium">{meeting.title}</p>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            {format(new Date(meeting.date), "PPp")}
          </div>
          {contact && (
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              {contact.name}
            </div>
          )}
          {meeting.location && (
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              {meeting.location}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface UpcomingMeetingsProps {
  meetings?: Meeting[];
}

export default function UpcomingMeetings({ meetings = [] }: UpcomingMeetingsProps) {
  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const upcomingMeetings = meetings
    .filter(meeting => isAfter(new Date(meeting.date), new Date()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getContactForMeeting = (meeting: Meeting) => {
    return contacts?.find(contact => contact.id === meeting.contactId);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl">Upcoming Meetings</CardTitle>
        <Link href="/meetings" className="text-sm text-muted-foreground hover:text-primary">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {upcomingMeetings?.map((meeting) => (
            <UpcomingMeetingItem
              key={meeting.id}
              meeting={meeting}
              contact={getContactForMeeting(meeting)}
            />
          ))}
          {(!upcomingMeetings || upcomingMeetings.length === 0) && (
            <p className="text-sm text-muted-foreground py-4">
              No upcoming meetings scheduled
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}