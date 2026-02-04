'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateClient } from '@/lib/query/hooks'

export default function NewClientPage() {
  const router = useRouter()
  const createClient = useCreateClient()

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    portalSlug: '',
    timezone: 'Asia/Manila',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Auto-generate portal slug from company name
    if (name === 'companyName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData((prev) => ({ ...prev, portalSlug: slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    createClient.mutate(formData, {
      onSuccess: () => {
        router.push('/admin/clients')
        router.refresh()
      },
    })
  }

  const error = createClient.error?.message ?? ''

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-heading text-foreground">New Client</h2>
        <Link href="/admin/clients">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                placeholder="Acme Corporation"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@acme.com"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portalSlug">Portal Slug *</Label>
              <Input
                id="portalSlug"
                name="portalSlug"
                value={formData.portalSlug}
                onChange={handleChange}
                required
                placeholder="acme-corporation"
                pattern="^[a-z0-9-]+$"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. This will be used in the portal URL.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
              >
                <option value="Asia/Manila">Asia/Manila (PHT)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
