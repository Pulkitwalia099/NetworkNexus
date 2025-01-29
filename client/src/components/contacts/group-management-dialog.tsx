import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";

interface GroupManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GroupManagementDialog({
  open,
  onOpenChange,
}: GroupManagementDialogProps) {
  const [newGroup, setNewGroup] = useState("");
  const [editingGroup, setEditingGroup] = useState<{ original: string; current: string } | null>(
    null
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch groups
  const { data: groups } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/groups"],
    enabled: open,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (group: string) => {
      const response = await fetch(`/api/contacts/groups/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group }),
      });
      if (!response.ok) {
        throw new Error("Failed to create group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group created successfully" });
      setNewGroup("");
    },
    onError: () => {
      toast({ 
        title: "Failed to create group",
        variant: "destructive"
      });
    }
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ oldGroup, newGroup }: { oldGroup: string; newGroup: string }) => {
      const response = await fetch(`/api/contacts/groups/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldGroup, newGroup }),
      });
      if (!response.ok) {
        throw new Error("Failed to update group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group updated successfully" });
      setEditingGroup(null);
    },
    onError: () => {
      toast({ 
        title: "Failed to update group",
        variant: "destructive"
      });
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupName: string) => {
      const response = await fetch(`/api/contacts/groups/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group: groupName }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to delete group",
        variant: "destructive"
      });
    }
  });

  const handleAddGroup = async () => {
    if (!newGroup.trim()) return;

    // Check if group already exists
    if (groups?.some(g => g.name === newGroup.trim())) {
      toast({ 
        title: "Group already exists",
        variant: "destructive"
      });
      return;
    }

    createGroupMutation.mutate(newGroup.trim());
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !editingGroup.current.trim()) return;

    // Check if new name already exists and it's not the same as the original
    if (groups?.some(g => g.name === editingGroup.current.trim()) && 
        editingGroup.current !== editingGroup.original) {
      toast({ 
        title: "Group already exists",
        variant: "destructive"
      });
      return;
    }

    updateGroupMutation.mutate({
      oldGroup: editingGroup.original,
      newGroup: editingGroup.current.trim(),
    });
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (window.confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      deleteGroupMutation.mutate(groupName);
    }
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
            {groups?.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                {editingGroup?.original === group.name ? (
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
                    <span>{group.name}</span>
                    <div className="space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditingGroup({ original: group.name, current: group.name })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGroup(group.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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