import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Widget from "@/components/dashboard/widget";
import StatsCard from "@/components/dashboard/stats-card";
import TaskList from "@/components/tasks/task-list";
import UpcomingMeetings from "@/components/dashboard/upcoming-meetings";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { loadWidgetConfig, saveWidgetConfig, type WidgetConfig } from "@/lib/widgets";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export default function Dashboard() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const { data: contacts } = useQuery<any[]>({ queryKey: ["/api/contacts"] });
  const { data: meetings } = useQuery<any[]>({ queryKey: ["/api/meetings"] });
  const { data: tasks } = useQuery<any[]>({ queryKey: ["/api/tasks"] });

  useEffect(() => {
    setWidgets(loadWidgetConfig());
  }, []);

  const handleLayoutChange = (layout: GridLayout.Layout[]) => {
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return widget;
    });
    setWidgets(updatedWidgets);
    saveWidgetConfig(updatedWidgets);
  };

  const addWidget = (type: WidgetConfig['type']) => {
    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      x: 0,
      y: Infinity, // Add to bottom
      w: 2,
      h: 2,
      settings: {},
    };

    setWidgets(prev => {
      const updated = [...prev, newWidget];
      saveWidgetConfig(updated);
      return updated;
    });
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => {
      const updated = prev.filter(w => w.id !== id);
      saveWidgetConfig(updated);
      return updated;
    });
  };

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'stats':
        const statType = widget.settings?.statType;
        let value = 0;
        let icon: "users" | "calendar" | "check-square" | "check-circle" = "users";

        if (statType === 'contacts') {
          value = contacts?.length || 0;
          icon = "users";
        } else if (statType === 'meetings') {
          value = meetings?.filter(m => new Date(m.date) > new Date()).length || 0;
          icon = "calendar";
        } else if (statType === 'tasks') {
          const status = widget.settings?.status;
          value = tasks?.filter(t => t.status === status).length || 0;
          icon = status === 'completed' ? "check-circle" : "check-square";
        }

        return <StatsCard title={widget.title} value={value} icon={icon} />;

      case 'tasks':
        return (
          <div className="h-full overflow-auto">
            <TaskList tasks={tasks?.slice(0, widget.settings?.limit || 5) || []} />
          </div>
        );

      case 'meetings':
        return (
          <div className="h-full overflow-auto">
            <UpcomingMeetings meetings={meetings?.slice(0, widget.settings?.limit || 5) || []} />
          </div>
        );

      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <div>
      <Header 
        title="Dashboard" 
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addWidget('stats')}>
                Stats Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget('tasks')}>
                Tasks Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget('meetings')}>
                Meetings Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="p-6">
        <GridLayout
          className="layout"
          layout={widgets.map(({ id, x, y, w, h }) => ({ i: id, x, y, w, h }))}
          cols={4}
          rowHeight={150}
          width={1200}
          onLayoutChange={handleLayoutChange}
          draggableHandle="[data-drag-handle]"
        >
          {widgets.map(widget => (
            <div key={widget.id}>
              <Widget
                id={widget.id}
                title={widget.title}
                onRemove={() => removeWidget(widget.id)}
              >
                {renderWidget(widget)}
              </Widget>
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  );
}