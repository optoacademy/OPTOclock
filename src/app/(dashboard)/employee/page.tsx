'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockEventType } from '@prisma/client';

type ClockStatus = {
  isClockedIn: boolean;
  isOnBreak: boolean;
  lastEvent: {
    type: ClockEventType;
    timestampUtc: string;
  } | null;
}

async function fetchClockStatus(): Promise<ClockStatus> {
  const res = await fetch('/api/clock');
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

async function clockAction(type: ClockEventType) {
  const res = await fetch('/api/clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Clock action failed');
  }
  return res.json();
}

export default function EmployeeDashboardPage() {
  const queryClient = useQueryClient();
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['clockStatus'],
    queryFn: fetchClockStatus,
  });

  const mutation = useMutation({
    mutationFn: clockAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clockStatus'] });
    },
  });

  const handleClock = (type: ClockEventType) => {
    mutation.mutate(type);
  }

  const getStatusText = () => {
    if (isLoading) return "Loading...";
    if (error) return "Error";
    if (status?.isOnBreak) return "On Break";
    if (status?.isClockedIn) return "Clocked In";
    return "Clocked Out";
  }

  const renderActionButtons = () => {
    if (isLoading || error) return null;

    if (status?.isClockedIn && !status.isOnBreak) {
      return (
        <>
          <Button variant="destructive" size="lg" onClick={() => handleClock(ClockEventType.OUT)}>Clock Out</Button>
          <Button variant="outline" size="lg" onClick={() => handleClock(ClockEventType.BREAK_START)}>Start Break</Button>
        </>
      );
    }
    if (status?.isOnBreak) {
      return <Button size="lg" onClick={() => handleClock(ClockEventType.BREAK_END)}>End Break</Button>;
    }
    return <Button size="lg" onClick={() => handleClock(ClockEventType.IN)}>Clock In</Button>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <div className="flex space-x-2">
          {renderActionButtons()}
        </div>
      </div>

      {mutation.isError && <p className="text-red-500 mb-4">Error: {mutation.error.message}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Current Status</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{getStatusText()}</p>
            {status?.lastEvent && <p className="text-sm text-gray-500">Since: {new Date(status.lastEvent.timestampUtc).toLocaleTimeString()}</p>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader><CardTitle>Hours this Week</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">--h --m</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader><CardTitle>My Recent Clocking Events</CardTitle></CardHeader>
          <CardContent>
            <p>A list of recent clock-in/out events will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
