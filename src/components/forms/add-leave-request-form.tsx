'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea' // Assuming textarea exists
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LeaveRequestType } from '@prisma/client'

const addLeaveRequestSchema = z.object({
  type: z.nativeEnum(LeaveRequestType),
  startUtc: z.string().min(1, "Start date is required."),
  endUtc: z.string().min(1, "End date is required."),
  reason: z.string().min(10, 'A reason of at least 10 characters is required.'),
})

type AddLeaveRequestValues = z.infer<typeof addLeaveRequestSchema>

async function createLeaveRequest(values: AddLeaveRequestValues) {
  const response = await fetch('/api/leave-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        ...values,
        startUtc: new Date(values.startUtc).toISOString(),
        endUtc: new Date(values.endUtc).toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to submit leave request')
  }

  return response.json()
}

export function AddLeaveRequestForm() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddLeaveRequestValues>({
    resolver: zodResolver(addLeaveRequestSchema),
  })

  const mutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
      reset()
      setOpen(false)
    },
  })

  const onSubmit = (data: AddLeaveRequestValues) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Leave Request</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a Leave Request</DialogTitle>
          <DialogDescription>
            Your request will be sent to your manager for approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="type">Leave Type</Label>
              <select id="type" {...register('type')} className="w-full p-2 border rounded-md">
                {Object.values(LeaveRequestType).map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="startUtc">Start Date</Label>
                    <Input id="startUtc" type="date" {...register('startUtc')} />
                    {errors.startUtc && <p className="text-red-500 text-xs mt-1">{errors.startUtc.message}</p>}
                </div>
                <div>
                    <Label htmlFor="endUtc">End Date</Label>
                    <Input id="endUtc" type="date" {...register('endUtc')} />
                    {errors.endUtc && <p className="text-red-500 text-xs mt-1">{errors.endUtc.message}</p>}
                </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" {...register('reason')} />
              {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
