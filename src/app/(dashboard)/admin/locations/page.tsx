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
import { AddLocationForm } from '@/components/forms/add-location-form'

type Location = {
  id: string;
  name: string;
  address: string;
  geofenceRadiusM: number | null;
  ipWhitelist: string[];
};

async function fetchLocations(): Promise<Location[]> {
  const res = await fetch('/api/locations')
  if (!res.ok) {
    throw new Error('Failed to fetch locations')
  }
  return res.json()
}

export default function LocationsPage() {
  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Work Locations</h1>
        <AddLocationForm />
      </div>

      {isLoading && <p>Loading locations...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      {locations && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Geofence Radius</TableHead>
                <TableHead>IP Whitelist</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.address}</TableCell>
                  <TableCell>
                    {location.geofenceRadiusM ? `${location.geofenceRadiusM}m` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {location.ipWhitelist && location.ipWhitelist.length > 0
                      ? location.ipWhitelist.join(', ')
                      : 'Any'}
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
