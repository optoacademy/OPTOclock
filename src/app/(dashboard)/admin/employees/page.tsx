'use client'

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
import { AddEmployeeForm } from '@/components/forms/add-employee-form'
import { SetPinForm } from '@/components/forms/set-pin-form'

// Define the type for an employee based on the API response
// This should eventually be shared from a types definition file
type Employee = {
  id: string;
  user: {
    fullName: string | null;
    email: string;
  } | null;
  externalCode: string | null;
  isActive: boolean;
  hireDate: string | null;
  createdAt: string;
  pinHash: string | null;
};

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch('/api/employees')
  if (!res.ok) {
    throw new Error('Failed to fetch employees')
  }
  return res.json()
}

export default function EmployeesPage() {
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
        <AddEmployeeForm />
      </div>

      {isLoading && <p>Loading employees...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      {employees && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>PIN Set</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.user?.fullName || 'N/A'}</TableCell>
                  <TableCell>{employee.user?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.pinHash ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {employee.pinHash ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <SetPinForm employeeId={employee.id} />
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
