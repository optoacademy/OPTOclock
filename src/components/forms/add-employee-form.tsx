'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useState } from 'react'

const addEmployeeSchema = z.object({
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  externalCode: z.string().optional(),
})

type AddEmployeeValues = z.infer<typeof addEmployeeSchema>

async function createEmployee(values: AddEmployeeValues) {
  const response = await fetch('/api/employees', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create employee')
  }

  return response.json()
}

export function AddEmployeeForm() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddEmployeeValues>({
    resolver: zodResolver(addEmployeeSchema),
  })

  const mutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      // Invalidate and refetch the employees query to show the new employee
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      console.log('Employee created successfully!')
      reset()
      setOpen(false)
    },
    onError: (error) => {
      // TODO: Show a toast notification with the error
      console.error('Failed to create employee:', error)
    }
  })

  const onSubmit = (data: Add-EmployeeValues) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Employee</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter the details of the new employee. They will be invited to join the organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Full Name
              </Label>
              <Input id="fullName" {...register('fullName')} className="col-span-3" />
              {errors.fullName && <p className="col-span-4 text-red-500 text-xs">{errors.fullName.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" {...register('email')} className="col-span-3" />
              {errors.email && <p className="col-span-4 text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="externalCode" className="text-right">
                External Code
              </Label>
              <Input id="externalCode" {...register('externalCode')} className="col-span-3" />
              {errors.externalCode && <p className="col-span-4 text-red-500 text-xs">{errors.externalCode.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
