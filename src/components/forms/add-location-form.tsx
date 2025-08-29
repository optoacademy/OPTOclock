'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useState, useMemo } from 'react'

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

const addLocationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  address: z.string().min(5, 'Please enter a valid address.'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  geofenceRadiusM: z.coerce.number().positive('Radius must be a positive number.').optional(),
  ipWhitelist: z.string().optional().transform(val => val ? val.split(',').map(ip => ip.trim()) : []),
})

type AddLocationValues = z.infer<typeof addLocationSchema>

async function createLocation(values: AddLocationValues) {
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    throw new Error('Failed to create location')
  }

  return response.json()
}

export function AddLocationForm() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const DynamicMap = useMemo(() => dynamic(() => import('@/components/map/dynamic-map'), { ssr: false }), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<AddLocationValues>({
    resolver: zodResolver(addLocationSchema),
    defaultValues: {
        lat: 51.505, // Default to London
        lng: -0.09,
        geofenceRadiusM: 100,
    }
  })

  const lat = watch('lat');
  const lng = watch('lng');
  const radius = watch('geofenceRadiusM');

  const mutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      reset()
      setOpen(false)
    },
  })

  const onSubmit = (data: AddLocationValues) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Location</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
          <DialogDescription>
            Define a new work center for your employees.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Location Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register('address')} />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <Label htmlFor="geofenceRadiusM">Geofence Radius (meters)</Label>
                <Input id="geofenceRadiusM" type="number" {...register('geofenceRadiusM')} />
                {errors.geofenceRadiusM && <p className="text-red-500 text-xs mt-1">{errors.geofenceRadiusM.message}</p>}
              </div>
              <div>
                <Label htmlFor="ipWhitelist">Whitelisted IPs (comma-separated)</Label>
                <Input id="ipWhitelist" {...register('ipWhitelist')} />
                {errors.ipWhitelist && <p className="text-red-500 text-xs mt-1">{errors.ipWhitelist.message}</p>}
              </div>
            </div>
            <div>
              <Label>Map Preview</Label>
              <div className="mt-2 rounded-md overflow-hidden h-[400px]">
                {lat && lng && <DynamicMap position={[lat, lng]} radius={radius} />}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Note: Map preview is for visualization. Set Lat/Lng manually for now.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
