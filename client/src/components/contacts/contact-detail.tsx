import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact, Interaction } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Phone, Building2, Briefcase, Users, Tag, Link } from "lucide-react";
import { SiLinkedin, SiGithub } from "react-icons/si";
import { BsTwitterX } from "react-icons/bs";
import InteractionList from "./interaction-list";
import InteractionForm from "./interaction-form";
import { motion, AnimatePresence } from "framer-motion";

interface ContactDetailProps {
  contact: Contact;
  open: boolean;
  onClose: () => void;
}

export default function ContactDetail({ contact, open, onClose }: ContactDetailProps) {
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: interactions } = useQuery<Interaction[]>({
    queryKey: [`/api/contacts/${contact.id}/interactions`],
    enabled: open,
  });

  const sortedInteractions = interactions?.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const createInteractionMutation = useMutation({
    mutationFn: async (data: Partial<Interaction>) => {
      const response = await fetch(`/api/contacts/${contact.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/contacts/${contact.id}/interactions`] 
      });
      toast({ title: "Interaction added successfully" });
      setIsInteractionFormOpen(false);
    },
  });

  const handleAddInteraction = (data: Partial<Interaction>) => {
    createInteractionMutation.mutate(data);
  };

  const ContactInfoItem = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
    <motion.div 
      className="flex items-center text-sm text-muted-foreground space-x-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </motion.div>
  );

  const SocialLink = ({ 
    url, 
    icon: Icon, 
    username, 
    platform 
  }: { 
    url: string; 
    icon: React.ElementType; 
    username: string;
    platform: string;
  }) => (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Icon className="h-4 w-4" />
      <span>{username}</span>
    </motion.a>
  );

  const tags = Array.isArray(contact.tags) ? contact.tags : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <motion.div 
          className="grid gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Contact Info Section */}
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <motion.h2 
                className="text-2xl font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {contact.name}
              </motion.h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {contact.email && (
                    <ContactInfoItem icon={Mail}>{contact.email}</ContactInfoItem>
                  )}
                  {contact.phone && (
                    <ContactInfoItem icon={Phone}>{contact.phone}</ContactInfoItem>
                  )}
                  {contact.company && (
                    <ContactInfoItem icon={Building2}>{contact.company}</ContactInfoItem>
                  )}
                  {contact.title && (
                    <ContactInfoItem icon={Briefcase}>{contact.title}</ContactInfoItem>
                  )}
                  {contact.group && (
                    <ContactInfoItem icon={Users}>{contact.group}</ContactInfoItem>
                  )}
                </AnimatePresence>

                {/* Social Media Links */}
                {(contact.linkedinUrl || contact.twitterHandle || contact.githubUsername) && (
                  <motion.div 
                    className="pt-2 space-y-2 border-t"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {contact.linkedinUrl && (
                      <SocialLink
                        url={contact.linkedinUrl}
                        icon={SiLinkedin}
                        username={contact.linkedinUrl.split('/').pop() || 'LinkedIn Profile'}
                        platform="LinkedIn"
                      />
                    )}
                    {contact.twitterHandle && (
                      <SocialLink
                        url={`https://twitter.com/${contact.twitterHandle.replace('@', '')}`}
                        icon={BsTwitterX}
                        username={contact.twitterHandle}
                        platform="Twitter"
                      />
                    )}
                    {contact.githubUsername && (
                      <SocialLink
                        url={`https://github.com/${contact.githubUsername}`}
                        icon={SiGithub}
                        username={contact.githubUsername}
                        platform="GitHub"
                      />
                    )}
                  </motion.div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <motion.div 
                    className="flex items-center text-sm text-muted-foreground space-x-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Tag className="h-4 w-4" />
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag, index) => (
                        <motion.span
                          key={tag}
                          className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button 
                onClick={() => setIsInteractionFormOpen(true)}
                className="bg-primary/10 text-primary hover:bg-primary/20"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Interaction
              </Button>
            </motion.div>
          </div>

          {/* Timeline Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4">Interaction Timeline</h3>
            <AnimatePresence>
              {sortedInteractions?.length ? (
                <InteractionList interactions={sortedInteractions} />
              ) : (
                <motion.p 
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  No interactions recorded yet.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        <InteractionForm
          open={isInteractionFormOpen}
          onClose={() => setIsInteractionFormOpen(false)}
          onSubmit={handleAddInteraction}
        />
      </DialogContent>
    </Dialog>
  );
}