'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function SessionActions({ sessionId }: { sessionId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this session?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error?.message || 'Failed to revoke session')
      }
    } catch (error) {
      alert('Failed to revoke session')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRevoke}
      disabled={isLoading}
      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
    >
      {isLoading ? 'Revoking...' : 'Revoke'}
    </Button>
  )
}
