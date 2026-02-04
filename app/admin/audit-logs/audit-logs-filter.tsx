'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const eventTypes = [
  'OTP_VERIFIED', 'OTP_FAILED', 'OTP_LOCKED',
  'SESSION_CREATED', 'SESSION_REVOKED',
  'QUOTE_VIEWED', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED',
  'PDF_DOWNLOADED',
  'ACCESS_CODE_CREATED', 'ACCESS_CODE_REVOKED',
  'CLIENT_CREATED', 'CLIENT_UPDATED',
  'QUOTE_CREATED', 'QUOTE_UPDATED', 'QUOTE_SENT',
  'RATE_LIMIT_HIT',
]

const actorTypes = ['admin', 'client', 'system', 'anonymous']

export function AuditLogsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const eventType = searchParams.get('eventType') || 'all'
  const actorType = searchParams.get('actorType') || 'all'

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
          Event Type
        </label>
        <Select
          value={eventType}
          onValueChange={(val) => handleFilter('eventType', val)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {eventTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none text-muted-foreground">
          Actor Type
        </label>
        <Select
          value={actorType}
          onValueChange={(val) => handleFilter('actorType', val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Actors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actors</SelectItem>
            {actorTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
