import { 
  Contact, 
  Meeting, 
  Task, 
  Interaction, 
  ContactConnection 
} from '@db/schema';

// Initial set of mock data for local development
const mockContacts: Contact[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    company: 'Acme Inc',
    title: 'CEO',
    avatar: null,
    notes: 'Met at conference',
    group: 'Client',
    tags: ['important', 'sales'],
    linkedinUrl: null,
    twitterHandle: null,
    githubUsername: null,
    socialProfiles: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '987-654-3210',
    company: 'Tech Solutions',
    title: 'CTO',
    avatar: null,
    notes: 'Technical partner',
    group: 'Partner',
    tags: ['technical', 'development'],
    linkedinUrl: null,
    twitterHandle: null,
    githubUsername: null,
    socialProfiles: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockMeetings: Meeting[] = [
  {
    id: 1,
    title: 'Initial Consultation',
    description: 'Discuss project requirements',
    date: new Date(Date.now() + 86400000), // Tomorrow
    location: 'Office',
    status: 'scheduled',
    contactId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: 'Technical Review',
    description: 'Review technical specifications',
    date: new Date(Date.now() + 172800000), // Day after tomorrow
    location: 'Virtual',
    status: 'scheduled',
    contactId: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Send proposal',
    description: 'Finalize and send project proposal',
    dueDate: new Date(Date.now() + 259200000), // 3 days from now
    priority: 'high',
    status: 'pending',
    category: 'Sales',
    contactId: 1,
    tags: ['proposal', 'urgent'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: 'Research competition',
    description: 'Analyze competing products',
    dueDate: new Date(Date.now() + 345600000), // 4 days from now
    priority: 'medium',
    status: 'pending',
    category: 'Research',
    contactId: null,
    tags: ['research'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockInteractions: Interaction[] = [
  {
    id: 1,
    contactId: 1,
    type: 'Call',
    title: 'Introduction call',
    description: 'Discussed potential project',
    date: new Date(Date.now() - 86400000), // Yesterday
    outcome: 'Positive',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    contactId: 2,
    type: 'Email',
    title: 'Follow-up email',
    description: 'Sent technical documentation',
    date: new Date(Date.now() - 43200000), // 12 hours ago
    outcome: 'Waiting for response',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockConnections: ContactConnection[] = [
  {
    id: 1,
    sourceContactId: 1,
    targetContactId: 2,
    relationshipType: 'Colleague',
    tags: ['business'],
    notes: 'Work together on multiple projects',
    strength: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// In-memory storage for CRUD operations
let contacts = [...mockContacts];
let meetings = [...mockMeetings];
let tasks = [...mockTasks];
let interactions = [...mockInteractions];
let connections = [...mockConnections];
let groups = ['Client', 'Partner', 'Prospect', 'Vendor'];

// Helper function to get the next ID for a collection
const getNextId = (collection: any[]): number => {
  return collection.length > 0 
    ? Math.max(...collection.map(item => item.id)) + 1 
    : 1;
};

// Mock data service
export const mockDataService = {
  // Contacts
  getContacts: (search?: string) => {
    if (search) {
      return contacts.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return contacts;
  },
  getContactById: (id: number) => contacts.find(c => c.id === id),
  createContact: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact = {
      ...data,
      id: getNextId(contacts),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Contact;
    contacts.push(newContact);
    return newContact;
  },
  updateContact: (id: number, data: Partial<Contact>) => {
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    contacts[index] = {
      ...contacts[index],
      ...data,
      updatedAt: new Date(),
    };
    return contacts[index];
  },
  deleteContact: (id: number) => {
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    const deletedContact = contacts[index];
    contacts = contacts.filter(c => c.id !== id);
    return deletedContact;
  },

  // Meetings
  getMeetings: () => meetings,
  getMeetingById: (id: number) => meetings.find(m => m.id === id),
  createMeeting: (data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMeeting = {
      ...data,
      id: getNextId(meetings),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Meeting;
    meetings.push(newMeeting);
    return newMeeting;
  },
  updateMeeting: (id: number, data: Partial<Meeting>) => {
    const index = meetings.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    meetings[index] = {
      ...meetings[index],
      ...data,
      updatedAt: new Date(),
    };
    return meetings[index];
  },
  deleteMeeting: (id: number) => {
    const index = meetings.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    const deletedMeeting = meetings[index];
    meetings = meetings.filter(m => m.id !== id);
    return deletedMeeting;
  },

  // Tasks
  getTasks: () => tasks,
  getTaskById: (id: number) => tasks.find(t => t.id === id),
  getContactTasks: () => tasks.filter(t => t.contactId !== null),
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask = {
      ...data,
      id: getNextId(tasks),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task;
    tasks.push(newTask);
    return newTask;
  },
  updateTask: (id: number, data: Partial<Task>) => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    tasks[index] = {
      ...tasks[index],
      ...data,
      updatedAt: new Date(),
    };
    return tasks[index];
  },
  deleteTask: (id: number) => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    const deletedTask = tasks[index];
    tasks = tasks.filter(t => t.id !== id);
    return deletedTask;
  },

  // Interactions
  getInteractions: () => interactions,
  getInteractionById: (id: number) => interactions.find(i => i.id === id),
  createInteraction: (data: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInteraction = {
      ...data,
      id: getNextId(interactions),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Interaction;
    interactions.push(newInteraction);
    return newInteraction;
  },
  updateInteraction: (id: number, data: Partial<Interaction>) => {
    const index = interactions.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    interactions[index] = {
      ...interactions[index],
      ...data,
      updatedAt: new Date(),
    };
    return interactions[index];
  },
  deleteInteraction: (id: number) => {
    const index = interactions.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    const deletedInteraction = interactions[index];
    interactions = interactions.filter(i => i.id !== id);
    return deletedInteraction;
  },

  // Connections
  getConnections: () => connections,
  getConnectionsForContact: (contactId: number) => {
    return connections.filter(c => 
      c.sourceContactId === contactId || 
      c.targetContactId === contactId
    );
  },
  createConnection: (data: Omit<ContactConnection, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newConnection = {
      ...data,
      id: getNextId(connections),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ContactConnection;
    connections.push(newConnection);
    return newConnection;
  },
  updateConnection: (id: number, data: Partial<ContactConnection>) => {
    const index = connections.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    connections[index] = {
      ...connections[index],
      ...data,
      updatedAt: new Date(),
    };
    return connections[index];
  },
  deleteConnection: (id: number) => {
    const index = connections.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    const deletedConnection = connections[index];
    connections = connections.filter(c => c.id !== id);
    return deletedConnection;
  },

  // Groups
  getGroups: () => groups.map(name => ({ name })),
  createGroup: (name: string) => {
    if (!groups.includes(name)) {
      groups.push(name);
      return { name };
    }
    return null;
  },
  updateGroup: (oldName: string, newName: string) => {
    const index = groups.indexOf(oldName);
    if (index === -1) return null;
    
    groups[index] = newName;
    
    // Update all contacts with this group
    contacts = contacts.map(c => {
      if (c.group === oldName) {
        return { ...c, group: newName, updatedAt: new Date() };
      }
      return c;
    });
    
    return { name: newName };
  },
  deleteGroup: (name: string) => {
    const index = groups.indexOf(name);
    if (index === -1) return null;
    
    groups = groups.filter(g => g !== name);
    
    // Remove this group from contacts
    contacts = contacts.map(c => {
      if (c.group === name) {
        return { ...c, group: null, updatedAt: new Date() };
      }
      return c;
    });
    
    return { success: true };
  },
};