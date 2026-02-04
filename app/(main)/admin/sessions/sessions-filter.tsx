'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SessionsFilter({ clients }: { clients: { id: string; companyName: string }[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const clientId = searchParams.get('clientId') || 'all'
  const active = searchParams.get('active') || 'all'

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset page on filter change
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none text-muted-foreground">
          Client
        </label>
        <Select
          value={clientId}
          onValueChange={(val) => handleFilter('clientId', val)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none text-muted-foreground">
          Status
        </label>
        <Select
          value={active}
          onValueChange={(val) => handleFilter('active', val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Sessions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            <SelectItem value="true">Active Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
