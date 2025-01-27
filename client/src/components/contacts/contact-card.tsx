import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Contact } from "@db/schema";

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

export default function ContactCard({ contact, onClick }: ContactCardProps) {
  return (
    <Card 
      className="p-4 hover:bg-accent cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={contact.avatar} />
          <AvatarFallback>
            {contact.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {contact.name}
          </p>
          {contact.title && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {contact.title}
            </p>
          )}
          {contact.company && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {contact.company}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
