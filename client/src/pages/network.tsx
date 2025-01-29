import { useCallback, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import ReactFlow, { 
  Node, 
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import Header from "@/components/layout/header";
import { Contact, Interaction } from "@db/schema";

const nodeColors: Record<string, string> = {
  client: '#22c55e',    // Green
  colleague: '#3b82f6', // Blue
  friend: '#f59e0b',    // Orange
  family: '#ec4899',    // Pink
  other: '#6b7280',     // Gray
};

function generateNetworkData(contacts: Contact[], interactions: Interaction[]) {
  // Create nodes for each contact
  const nodes: Node[] = contacts.map((contact) => ({
    id: contact.id.toString(),
    data: { 
      label: contact.name,
      group: contact.group || 'other',
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
      width: 150,
    },
  }));

  // Create edges from interactions
  const edges: Edge[] = interactions
    .filter(interaction => {
      // Find all unique contact pairs that have interactions
      const contactExists = contacts.some(c => c.id === interaction.contactId);
      return contactExists;
    })
    .map((interaction, index) => ({
      id: `e-${interaction.id}-${index}`,
      source: interaction.contactId.toString(),
      target: interaction.contactId.toString(),
      label: interaction.type,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#64748b' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));

  return { nodes, edges };
}

export default function NetworkView() {
  const { data: contacts } = useQuery<Contact[]>({ 
    queryKey: ["/api/contacts"] 
  });

  const { data: interactions } = useQuery<Interaction[]>({ 
    queryKey: ["/api/interactions"] 
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update network data whenever contacts or interactions change
  useEffect(() => {
    if (contacts && interactions) {
      const { nodes: initialNodes, edges: initialEdges } = generateNetworkData(contacts, interactions);
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [contacts, interactions, setNodes, setEdges]);

  return (
    <div>
      <Header title="Contact Network" />
      <div style={{ height: 'calc(100vh - 64px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}