import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Pencil, X } from "lucide-react";

interface GroupManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingGroups: string[];
}

export default function GroupManagementDialog({
  open,
  onOpenChange,
  existingGroups,
}: GroupManagementDialogProps) {
  const [newGroup, setNewGroup] = useState("");
  const [editingGroup, setEditingGroup] = useState<{ original: string; current: string } | null>(
    null
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateContactGroupsMutation = useMutation({
    mutationFn: async ({ oldGroup, newGroup }: { oldGroup: string; newGroup: string }) => {
      const response = await fetch(`/api/contacts/groups/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldGroup, newGroup }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Groups updated successfully" });
      setEditingGroup(null);
    },
  });

  const handleAddGroup = async () => {
    if (!newGroup.trim()) return;
    
    // Check if group already exists
    if (existingGroups.includes(newGroup)) {
      toast({ 
        title: "Group already exists",
        variant: "destructive"
      });
      return;
    }

    setNewGroup("");
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !editingGroup.current.trim()) return;
    
    // Check if new name already exists
    if (existingGroups.includes(editingGroup.current) && 
        editingGroup.current !== editingGroup.original) {
      toast({ 
        title: "Group already exists",
        variant: "destructive"
      });
      return;
    }

    updateContactGroupsMutation.mutate({
      oldGroup: editingGroup.original,
      newGroup: editingGroup.current,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="New group name"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
            />
            <Button onClick={handleAddGroup}>Add</Button>
          </div>
          <div className="space-y-2">
            {existingGroups.map((group) => (
              <div
                key={group}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                {editingGroup?.original === group ? (
                  <div className="flex-1 flex space-x-2">
                    <Input
                      value={editingGroup.current}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          current: e.target.value,
                        })
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateGroup()}
                    />
                    <Button onClick={handleUpdateGroup}>Save</Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingGroup(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span>{group}</span>
                    <div className="space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditingGroup({ original: group, current: group })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
