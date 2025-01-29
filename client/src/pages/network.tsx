import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactFlow, { 
  Node, 
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import Header from "@/components/layout/header";
import { Contact, ContactConnection } from "@db/schema";
import { Button } from "@/components/ui/button";
import ConnectionForm from "@/components/contacts/connection-form";
import { useToast } from "@/hooks/use-toast";

const nodeColors: Record<string, string> = {
  client: '#22c55e',    // Green
  colleague: '#3b82f6', // Blue
  friend: '#f59e0b',    // Orange
  family: '#ec4899',    // Pink
  other: '#6b7280',     // Gray
};

function generateNetworkData(contacts: Contact[], connections: ContactConnection[]) {
  // Create nodes for each contact
  const nodes: Node[] = contacts.map((contact) => ({
    id: contact.id.toString(),
    data: { 
      label: contact.name,
      group: contact.group || 'other',
      email: contact.email,
      company: contact.company,
    },
    position: { 
      x: Math.random() * 800, 
      y: Math.random() * 600 
    },
    style: {
      background: nodeColors[contact.group || 'other'],
      color: '#fff',
      border: '1px solid #fff',
      borderRadius: '8px',
      padding: '10px',
      width: 180,
    },
  }));

  // Create edges from connections
  const edges: Edge[] = connections.map((connection) => ({
    id: `e-${connection.id}`,
    source: connection.sourceContactId.toString(),
    target: connection.targetContactId.toString(),
    label: connection.relationshipType,
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#64748b',
      strokeWidth: connection.strength || 1,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    data: {
      tags: connection.tags,
      notes: connection.notes,
      strength: connection.strength,
    }
  }));

  return { nodes, edges };
}

export default function NetworkView() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isConnectionFormOpen, setIsConnectionFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts } = useQuery<Contact[]>({ 
    queryKey: ["/api/contacts"] 
  });

  const { data: connections } = useQuery<ContactConnection[]>({ 
    queryKey: ["/api/connections"] 
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (data: Partial<ContactConnection>) => {
      const response = await fetch('/api/contacts/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({ title: "Connection created successfully" });
      setIsConnectionFormOpen(false);
    },
  });

  // Update network data whenever contacts or connections change
  useEffect(() => {
    if (contacts && connections) {
      const { nodes: initialNodes, edges: initialEdges } = generateNetworkData(contacts, connections);
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [contacts, connections, setNodes, setEdges]);

  const handleNodeClick = (event: any, node: Node) => {
    const contact = contacts?.find(c => c.id.toString() === node.id);
    if (contact) {
      setSelectedContact(contact);
      setIsConnectionFormOpen(true);
    }
  };

  const handleCreateConnection = (data: Partial<ContactConnection>) => {
    createConnectionMutation.mutate(data);
  };

  const handleReorganize = () => {
    if (contacts && connections) {
      const { nodes: newNodes, edges: newEdges } = generateNetworkData(contacts, connections);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  };

  return (
    <div>
      <Header title="Contact Network" />
      <div style={{ height: 'calc(100vh - 64px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <Panel position="top-right">
            <Button onClick={handleReorganize}>
              Reorganize Network
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {selectedContact && contacts && (
        <ConnectionForm
          sourceContact={selectedContact}
          availableContacts={contacts}
          open={isConnectionFormOpen}
          onClose={() => {
            setIsConnectionFormOpen(false);
            setSelectedContact(null);
          }}
          onSubmit={handleCreateConnection}
        />
      )}
    </div>
  );
}