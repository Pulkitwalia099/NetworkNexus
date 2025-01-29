import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import StatsCard from "@/components/dashboard/stats-card";
import { Card } from "@/components/ui/card";
import TaskList from "@/components/tasks/task-list";
import UpcomingMeetings from "@/components/dashboard/upcoming-meetings";

export default function Dashboard() {
  const { data: contacts } = useQuery<any[]>({ queryKey: ["/api/contacts"] });
  const { data: meetings } = useQuery<any[]>({ queryKey: ["/api/meetings"] });
  const { data: tasks } = useQuery<any[]>({ queryKey: ["/api/tasks"] });

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Contacts"
            value={contacts?.length || 0}
            icon="users"
          />
          <StatsCard
            title="Upcoming Meetings"
            value={meetings?.filter(m => new Date(m.date) > new Date()).length || 0}
            icon="calendar"
          />
          <StatsCard
            title="Active Tasks"
            value={tasks?.filter(t => t.status === "pending").length || 0}
            icon="check-square"
          />
          <StatsCard
            title="Completed Tasks"
            value={tasks?.filter(t => t.status === "completed").length || 0}
            icon="check-circle"
          />
        </div>

        <div className="grid gap-6 mt-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Tasks</h2>
            <TaskList tasks={tasks?.slice(0, 5) || []} />
          </Card>

          <UpcomingMeetings />
        </div>
      </div>
    </div>
  );
}