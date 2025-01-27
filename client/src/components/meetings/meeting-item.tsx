import { format } from "date-fns";
import { Meeting } from "@db/schema";
import { Calendar, MapPin } from "lucide-react";

interface MeetingItemProps {
  meeting: Meeting;
}

export default function MeetingItem({ meeting }: MeetingItemProps) {
  return (
    <div className="flex items-center p-4 hover:bg-accent rounded-lg">
      <div className="flex-1">
        <h3 className="text-sm font-medium">{meeting.title}</h3>
        <div className="mt-1 flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0" />
          {format(new Date(meeting.date), "PPp")}
        </div>
        {meeting.location && (
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0" />
            {meeting.location}
          </div>
        )}
      </div>
      <div className="ml-4">
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
          {meeting.status}
        </span>
      </div>
    </div>
  );
}
