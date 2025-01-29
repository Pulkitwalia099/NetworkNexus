import { z } from "zod";

export const widgetConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['stats', 'tasks', 'meetings', 'chart']),
  title: z.string(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
  settings: z.object({
    // Stats widget settings
    statType: z.enum(['contacts', 'meetings', 'tasks']).optional(),
    status: z.enum(['pending', 'completed']).optional(),
    // List widget settings
    limit: z.number().min(1).max(10).optional(),
    // Chart widget settings
    chartType: z.enum(['bar', 'line', 'pie']).optional(),
    dateRange: z.enum(['day', 'week', 'month', 'year']).optional(),
  }).optional(),
});

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;

export const defaultWidgets: WidgetConfig[] = [
  {
    id: 'total-contacts',
    type: 'stats',
    title: 'Total Contacts',
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    settings: { statType: 'contacts' }
  },
  {
    id: 'upcoming-meetings',
    type: 'stats',
    title: 'Upcoming Meetings',
    x: 1,
    y: 0,
    w: 1,
    h: 1,
    settings: { statType: 'meetings' }
  },
  {
    id: 'active-tasks',
    type: 'stats',
    title: 'Active Tasks',
    x: 2,
    y: 0,
    w: 1,
    h: 1,
    settings: { statType: 'tasks', status: 'pending' }
  },
  {
    id: 'task-list',
    type: 'tasks',
    title: 'Recent Tasks',
    x: 0,
    y: 1,
    w: 2,
    h: 2,
    settings: { limit: 5 }
  },
  {
    id: 'meetings-list',
    type: 'meetings',
    title: 'Upcoming Meetings',
    x: 2,
    y: 1,
    w: 2,
    h: 2,
    settings: { limit: 5 }
  }
];

// Save widget configuration to localStorage
export const saveWidgetConfig = (widgets: WidgetConfig[]) => {
  try {
    const validatedWidgets = widgets.map(widget => {
      const result = widgetConfigSchema.safeParse(widget);
      if (!result.success) {
        console.error('Invalid widget config:', widget, result.error);
        return null;
      }
      return widget;
    }).filter(Boolean) as WidgetConfig[];

    localStorage.setItem('dashboard-widgets', JSON.stringify(validatedWidgets));
  } catch (error) {
    console.error('Failed to save widget configuration:', error);
  }
};

// Load widget configuration from localStorage
export const loadWidgetConfig = (): WidgetConfig[] => {
  try {
    const saved = localStorage.getItem('dashboard-widgets');
    if (!saved) return defaultWidgets;

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaultWidgets;

    const validatedWidgets = parsed.map(widget => {
      const result = widgetConfigSchema.safeParse(widget);
      if (!result.success) {
        console.error('Invalid widget config:', widget, result.error);
        return null;
      }
      return widget;
    }).filter(Boolean) as WidgetConfig[];

    return validatedWidgets.length > 0 ? validatedWidgets : defaultWidgets;
  } catch (error) {
    console.error('Failed to load widget configuration:', error);
    return defaultWidgets;
  }
};