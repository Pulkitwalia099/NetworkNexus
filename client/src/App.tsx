import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import Meetings from "@/pages/meetings";
import Tasks from "@/pages/tasks";
import NetworkView from "@/pages/network";
import Calendar from "@/pages/calendar";
import Sidebar from "@/components/layout/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <ErrorBoundary>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/meetings" component={Meetings} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/network" component={NetworkView} />
            <Route path="/calendar" component={Calendar} />
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;