import { useCallback } from 'react';
import { useQuery } from "@tanstack/react-query";
import ReactFlow, { 
  Node, 
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import Header from "@/components/layout/header";
import { Contact, Interaction } from "@db/schema";

function generateNetworkData(contacts: Contact[], interactions: Interaction[]) {
  const nodes: Node[] = contacts.map((contact) => ({
    id: contact.id.toString(),
    data: { 
      label: contact.name,
      group: contact.group,
      tags: contact.tags
    },
    position: { 
      x: Math.random() * 800, 
      y: Math.random() * 600 
    },
    className: `contact-node group-${contact.group}`,
  }));

  const edges: Edge[] = interactions.map((interaction) => ({
    id: `e-${interaction.id}`,
    source: interaction.contactId.toString(),
    target: interaction.contactId.toString(),
    label: interaction.type,
    animated: true,
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

  const onInit = useCallback(() => {
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
          onInit={onInit}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
