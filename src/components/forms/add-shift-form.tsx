'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const addShiftSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:mm format."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:mm format."),
  breakMinutesDefault: z.coerce.number().int().min(0).default(0),
  daysOfWeek: z.array(z.number()).min(1, "Select at least one day."),
})

type AddShiftValues = z.infer<typeof addShiftSchema>
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function createShift(values: AddShiftValues) {
  const response = await fetch('/api/shifts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    throw new Error('Failed to create shift')
  }

  return response.json()
}

export function AddShiftForm() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddShiftValues>({
    resolver: zodResolver(addShiftSchema),
    defaultValues: {
      daysOfWeek: [],
      breakMinutesDefault: 0,
    }
  })

  const mutation = useMutation({
    mutationFn: createShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      reset()
      setOpen(false)
    },
  })

  const onSubmit = (data: AddShiftValues) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Shift</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Work Shift</DialogTitle>
          <DialogDescription>
            Define a schedule for your employees.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Shift Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time (HH:mm)</Label>
                <Input id="startTime" {...register('startTime')} />
                {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
              </div>
              <div>
                <Label htmlFor="endTime">End Time (HH:mm)</Label>
                <Input id="endTime" {...register('endTime')} />
                {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="breakMinutesDefault">Default Break (minutes)</Label>
              <Input id="breakMinutesDefault" type="number" {...register('breakMinutesDefault')} />
              {errors.breakMinutesDefault && <p className="text-red-500 text-xs mt-1">{errors.breakMinutesDefault.message}</p>}
            </div>
            <div>
                <Label>Days of the Week</Label>
                <Controller
                    name="daysOfWeek"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {days.map((day, index) => (
                                <div key={day} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={day}
                                        checked={field.value?.includes(index)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), index])
                                                : field.onChange((field.value || []).filter((value) => value !== index));
                                        }}
                                    />
                                    <Label htmlFor={day} className="font-normal">{day}</Label>
                                </div>
                            ))}
                        </div>
                    )}
                />
                {errors.daysOfWeek && <p className="text-red-500 text-xs mt-1">{errors.daysOfWeek.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
