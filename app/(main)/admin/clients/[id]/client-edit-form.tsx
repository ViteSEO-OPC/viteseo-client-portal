'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useUpdateClient } from '@/lib/query/hooks'

interface ClientData {
  id: string
  companyName: string
  contactName: string
  email: string
  portalSlug: string
  status: string
  timezone: string
  createdAt: Date
  quotes: Array<{
    id: string
    quoteNumber: string
    status: string
    total: { toString(): string } | number | string
    validUntil: Date
    createdAt: Date
  }>
  accessCodes: Array<{
    id: string
    codeHint: string | null
    expiresAt: Date | null
    usedCount: number
    maxUses: number
    revokedAt: Date | null
    createdAt: Date
  }>
  _count: {
    quotes: number
    accessCodes: number
    sessions: number
  }
}

interface ClientEditFormProps {
  client: ClientData
}

export function ClientEditForm({ client }: ClientEditFormProps) {
  const router = useRouter()
  const updateClient = useUpdateClient(client.id)
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    companyName: client.companyName,
    contactName: client.contactName,
    email: client.email,
    portalSlug: client.portalSlug,
    timezone: client.timezone,
    status: client.status as 'active' | 'inactive' | 'archived',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage('')

    updateClient.mutate(formData, {
      onSuccess: () => {
        setSuccessMessage('Client updated successfully')
        router.refresh()
      },
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-muted text-muted-foreground'
      case 'sent':
        return 'bg-blue-500/15 text-blue-500'
      case 'viewed':
        return 'bg-yellow-500/15 text-yellow-500'
      case 'accepted':
        return 'bg-green-500/15 text-green-500'
      case 'rejected':
        return 'bg-red-500/15 text-red-500'
      case 'expired':
        return 'bg-gray-500/15 text-gray-500'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const error = updateClient.error?.message ?? ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading text-foreground">{client.companyName}</h2>
          <p className="text-muted-foreground">Client Details</p>
        </div>
        <Link href="/admin/clients">
          <Button variant="outline">Back to Clients</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{client._count.quotes}</p>
            <p className="text-sm text-muted-foreground">Total Quotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{client._count.accessCodes}</p>
            <p className="text-sm text-muted-foreground">Access Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{client._count.sessions}</p>
            <p className="text-sm text-muted-foreground">Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Client</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400">{successMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portalSlug">Portal Slug</Label>
                <Input
                  id="portalSlug"
                  name="portalSlug"
                  value={formData.portalSlug}
                  onChange={handleChange}
                  required
                  pattern="^[a-z0-9-]+$"
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateClient.isPending}>
                {updateClient.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Quotes</CardTitle>
          <Link href={`/admin/quotes/new?clientId=${client.id}`}>
            <Button size="sm">Create Quote</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {client.quotes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No quotes yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground">Quote #</th>
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Total</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Valid Until</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {client.quotes.map((quote) => (
                  <tr key={quote.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2 font-medium">{quote.quoteNumber}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="py-2 text-right">{formatCurrency(quote.total)}</td>
                    <td className="py-2 text-right text-sm text-muted-foreground">
                      {formatDate(quote.validUntil.toISOString(), client.timezone)}
                    </td>
                    <td className="py-2 text-right">
                      <Link href={`/admin/quotes/${quote.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Recent Access Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Access Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {client.accessCodes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No access codes yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground">Code Hint</th>
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-center py-2 text-sm font-medium text-muted-foreground">Uses</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Expires</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {client.accessCodes.map((code) => (
                  <tr key={code.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm text-foreground">****{code.codeHint ?? '****'}</code>
                    </td>
                    <td className="py-2" suppressHydrationWarning>
                      {code.revokedAt ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-red-500/15 text-red-500">
                          Revoked
                        </span>
                      ) : code.expiresAt && code.expiresAt < new Date() ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-muted text-muted-foreground">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-500/15 text-green-500">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-center">
                      {code.usedCount} / {code.maxUses}
                    </td>
                    <td className="py-2 text-right text-sm text-muted-foreground">
                      {code.expiresAt ? formatDate(code.expiresAt.toISOString(), client.timezone) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
