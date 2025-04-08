import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Meeting, Contact } from "@db/schema";
import { PencilIcon, Calendar, Users, MapPin, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface MeetingCardProps {
  meeting: Meeting;
  contact?: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export default function MeetingCard({ meeting, contact, onEdit, onDelete, onClick }: MeetingCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return;
    }
    onClick?.();
  };

  return (
    <Card 
      className="p-4 hover:bg-accent cursor-pointer relative group"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">{meeting.title}</h3>
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
          {meeting.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {meeting.description}
            </p>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="hover:bg-background"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Delete button clicked for meeting:", meeting.id);
              onDelete?.();
            }}
            className="hover:bg-background text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}