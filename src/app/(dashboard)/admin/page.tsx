import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Today's Clock-ins</CardTitle>
            <CardDescription>Total employees clocked in today.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Incidents</CardTitle>
            <CardDescription>Unresolved clocking incidents.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">3</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Pending approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Employees</CardTitle>
            <CardDescription>Total active employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">25</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        {/* Placeholder for charts or recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Activity feed will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
