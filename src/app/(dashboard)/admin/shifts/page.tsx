'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { AddShiftForm } from '@/components/forms/add-shift-form'

type WorkShift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutesDefault: number;
  daysOfWeek: number[];
};

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function fetchShifts(): Promise<WorkShift[]> {
  const res = await fetch('/api/shifts')
  if (!res.ok) {
    throw new Error('Failed to fetch shifts')
  }
  return res.json()
}

export default function ShiftsPage() {
  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ['shifts'],
    queryFn: fetchShifts,
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Work Shifts</h1>
        <AddShiftForm />
      </div>

      {isLoading && <p>Loading shifts...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      {shifts && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Default Break</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell>{shift.startTime.slice(0, 5)} - {shift.endTime.slice(0, 5)}</TableCell>
                  <TableCell>{shift.breakMinutesDefault} mins</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {days.map((day, index) => (
                        <span
                          key={day}
                          className={`px-2 py-1 text-xs rounded-full ${
                            shift.daysOfWeek.includes(index)
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
