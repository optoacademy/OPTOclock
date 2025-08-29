'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

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

const setPinSchema = z.object({
  pin: z.string().length(4, 'PIN must be 4 digits.').regex(/^\d{4}$/, 'PIN must only contain digits.'),
})

type SetPinValues = z.infer<typeof setPinSchema>

async function setEmployeePin({ employeeId, values }: { employeeId: string, values: SetPinValues }) {
  const response = await fetch(`/api/employees/${employeeId}/set-pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    throw new Error('Failed to set PIN')
  }

  return response.json()
}

interface SetPinFormProps {
    employeeId: string;
}

export function SetPinForm({ employeeId }: SetPinFormProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SetPinValues>({
    resolver: zodResolver(setPinSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: SetPinValues) => setEmployeePin({ employeeId, values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      // TODO: Add a success toast
      console.log('PIN set successfully!')
      reset()
      setOpen(false)
    },
    onError: (error) => {
        // TODO: Add an error toast
        console.error(error.message);
    }
  })

  const onSubmit = (data: SetPinValues) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">Set PIN</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Set Employee PIN</DialogTitle>
          <DialogDescription>
            Enter a 4-digit PIN for the employee to use in Kiosk mode.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="py-4">
            <Label htmlFor="pin">4-Digit PIN</Label>
            <Input id="pin" type="password" maxLength={4} {...register('pin')} />
            {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save PIN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
