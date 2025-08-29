'use client'

import { useQuery } from '@tanstack/react-query'
import { AddLeaveRequestForm } from '@/components/forms/add-leave-request-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClockEvent, LeaveRequest, LeaveRequestStatus } from '@prisma/client'

async function fetchClockHistory(): Promise<ClockEvent[]> {
  const res = await fetch('/api/clock/history')
  if (!res.ok) throw new Error('Failed to fetch clock history')
  return res.json()
}

async function fetchLeaveRequests(): Promise<LeaveRequest[]> {
  const res = await fetch('/api/leave-requests')
  if (!res.ok) throw new Error('Failed to fetch leave requests')
  return res.json()
}

const statusColors: Record<LeaveRequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function HistoryPage() {
  const { data: clockEvents, isLoading: isLoadingClock } = useQuery({
    queryKey: ['clockHistory'],
    queryFn: fetchClockHistory,
  })

  const { data: leaveRequests, isLoading: isLoadingLeave } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: fetchLeaveRequests,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6">My Clock History</h1>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingClock && <TableRow><TableCell colSpan={4}>Loading history...</TableCell></TableRow>}
              {clockEvents?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{new Date(event.timestampUtc).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(event.timestampUtc).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    <span className="font-medium">{event.type}</span>
                  </TableCell>
                  <TableCell>{event.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Leave Requests</h1>
            <AddLeaveRequestForm />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLeave && <TableRow><TableCell colSpan={4}>Loading requests...</TableCell></TableRow>}
              {leaveRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.type}</TableCell>
                  <TableCell>
                    {new Date(request.startUtc).toLocaleDateString()} - {new Date(request.endUtc).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[request.status]}`}>
                        {request.status}
                    </span>
                  </TableCell>
                  <TableCell>{request.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
