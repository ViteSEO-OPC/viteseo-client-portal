'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Timeline } from '@/components/ui/timeline'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useUpdateQuote, useSendQuote, useGenerateAccessCode } from '@/lib/query/hooks'

interface QuoteItem {
  id: string
  name: string
  description: string | null
  quantity: number
  unitPrice: string
  sortOrder: number
}

interface AccessCode {
  id: string
  codeHint: string
  expiresAt: string
  usedCount: number
  maxUses: number
  revokedAt: string | null
  createdAt: string
}

interface QuoteData {
  id: string
  quoteNumber: string
  version: number
  status: string
  validUntil: string
  total: string
  notes: string | null
  contentHash: string | null
  createdAt: string
  updatedAt: string
  client: {
    id: string
    companyName: string
    contactName: string
    portalSlug: string
    timezone: string
  }
  items: QuoteItem[]
  accessCodes: AccessCode[]
}

interface ActivityLog {
  id: string
  eventType: string
  action: string
  actorType: string
  actorId?: string | null
  ipAddress?: string | null
  createdAt: string
  meta?: Record<string, unknown> | null
}

interface QuoteDetailViewProps {
  quote: QuoteData
  activityLogs: ActivityLog[]
}

export function QuoteDetailView({ quote, activityLogs }: QuoteDetailViewProps) {
  const router = useRouter()

  // TanStack Query mutations
  const updateQuote = useUpdateQuote(quote.id)
  const sendQuote = useSendQuote(quote.id)
  const generateAccessCode = useGenerateAccessCode()

  const [formData, setFormData] = useState({
    validUntil: quote.validUntil.slice(0, 16),
    notes: quote.notes || '',
  })

  const [quoteStatus, setQuoteStatus] = useState(quote.status)
  const [generatedCode, setGeneratedCode] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [codeExpiration, setCodeExpiration] = useState('720')
  const [codeMaxUses, setCodeMaxUses] = useState('100')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage('')

    updateQuote.mutate(
      {
        validUntil: new Date(formData.validUntil).toISOString(),
        notes: formData.notes,
      },
      {
        onSuccess: () => {
          setSuccessMessage('Quote updated successfully')
          router.refresh()
        },
      }
    )
  }

  const handleSendQuote = async () => {
    if (!confirm('Send this quote to the client? The quote status will change to "sent".')) return

    setSuccessMessage('')

    sendQuote.mutate(undefined, {
      onSuccess: () => {
        setQuoteStatus('sent')
        setSuccessMessage('Quote sent successfully')
        router.refresh()
      },
    })
  }

  const handleGenerateAccessCode = async () => {
    setGeneratedCode('')

    generateAccessCode.mutate(
      {
        clientId: quote.client.id,
        quoteId: quote.id,
        expiresInHours: parseInt(codeExpiration),
        maxUses: parseInt(codeMaxUses),
      },
      {
        onSuccess: (data) => {
          setGeneratedCode(data.code)
          setShowCodeDialog(false)
          router.refresh()
        },
      }
    )
  }

  const handlePreviewPortal = async () => {
    setPreviewLoading(true)
    try {
      const response = await fetch('/api/admin/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          clientSlug: quote.client.portalSlug,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate preview token')
      }

      const data = await response.json()
      if (data.previewUrl) {
        window.open(data.previewUrl, '_blank')
      }
    } catch (error) {
      console.error('Preview error:', error)
      alert('Failed to generate preview. Please try again.')
    } finally {
      setPreviewLoading(false)
    }
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

  const [isExpired, setIsExpired] = useState(false)
  useEffect(() => {
    setIsExpired(new Date(quote.validUntil) < new Date())
  }, [quote.validUntil])

  const canEdit = quoteStatus === 'draft'
  const canSend = quoteStatus === 'draft' && !isExpired
  const canGenerateCode = quoteStatus === 'sent' || quoteStatus === 'viewed'

  // Combine errors from mutations
  const error =
    updateQuote.error?.message ||
    sendQuote.error?.message ||
    generateAccessCode.error?.message ||
    ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading text-foreground">{quote.quoteNumber}</h2>
          <p className="text-muted-foreground">
            For {quote.client.companyName}
            {quote.version > 1 && ` (Version ${quote.version})`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(quoteStatus)}`}>
            {quoteStatus}
          </span>
          <Link href="/admin/quotes">
            <Button variant="outline">Back to Quotes</Button>
          </Link>
        </div>
      </div>

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

      {generatedCode && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-400 mb-2">Access code generated! Share this with the client:</p>
          <div className="flex items-center gap-4">
            <code className="bg-background px-4 py-2 rounded border border-border text-lg font-mono font-bold text-foreground">
              {generatedCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(generatedCode)
                setSuccessMessage('Code copied to clipboard')
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-blue-400/80 mt-2" suppressHydrationWarning>
            Portal URL: {typeof window !== 'undefined' ? window.location.origin : ''}/enter-code
          </p>
        </div>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {canSend && (
              <Button
                onClick={handleSendQuote}
                disabled={sendQuote.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sendQuote.isPending ? 'Sending...' : 'Send Quote'}
              </Button>
            )}
            {canGenerateCode && (
              <Button
                onClick={() => setShowCodeDialog(true)}
                variant="outline"
              >
                Generate Access Code
              </Button>
            )}
            <Button
              onClick={handlePreviewPortal}
              disabled={previewLoading}
              variant="outline"
            >
              {previewLoading ? 'Loading...' : 'Preview Portal'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quote Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <div className="h-10 flex items-center px-3 bg-muted rounded-md border border-input text-sm">
                  <Link href={`/admin/clients/${quote.client.id}`} className="text-primary hover:underline">
                    {quote.client.companyName}
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={!canEdit}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 text-foreground placeholder:text-muted-foreground"
                placeholder="Optional notes for this quote"
              />
            </div>

            {canEdit && (
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateQuote.isPending}>
                  {updateQuote.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-sm font-medium text-muted-foreground">Item</th>
                <th className="text-right py-2 text-sm font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-2 text-sm font-medium text-muted-foreground">Unit Price</th>
                <th className="text-right py-2 text-sm font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {quote.items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3">
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right">
                    {formatCurrency(item.quantity * parseFloat(item.unitPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="py-4 text-right font-bold text-foreground">Total:</td>
                <td className="py-4 text-right font-bold text-lg text-primary">{formatCurrency(quote.total)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Access Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Access Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {quote.accessCodes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No access codes generated yet</p>
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
                {quote.accessCodes.map((code) => (
                  <tr key={code.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm text-foreground">****{code.codeHint}</code>
                    </td>
                    <td className="py-2" suppressHydrationWarning>
                      {code.revokedAt ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-red-500/15 text-red-500">
                          Revoked
                        </span>
                      ) : new Date(code.expiresAt) < new Date() ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-500/15 text-gray-500">
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
                      {formatDate(code.expiresAt, quote.client.timezone)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={activityLogs} />
        </CardContent>
      </Card>

      {/* Meta Information */}
      <Card>
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium text-foreground">{formatDate(quote.createdAt, quote.client.timezone)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium text-foreground">{formatDate(quote.updatedAt, quote.client.timezone)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Portal Slug</dt>
              <dd className="font-medium text-foreground">{quote.client.portalSlug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Content Hash</dt>
              <dd className="font-mono text-xs text-foreground">{quote.contentHash || 'N/A'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Generate Access Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Access Code</DialogTitle>
            <DialogDescription>
              Create an access code for {quote.client.companyName} to view quote {quote.quoteNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expiration</Label>
              <Select value={codeExpiration} onValueChange={setCodeExpiration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200] bg-zinc-900 border-zinc-700 shadow-2xl">
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                  <SelectItem value="720">30 days</SelectItem>
                  <SelectItem value="2160">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Select value={codeMaxUses} onValueChange={setCodeMaxUses}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200] bg-zinc-900 border-zinc-700 shadow-2xl">
                  <SelectItem value="3">3 uses</SelectItem>
                  <SelectItem value="10">10 uses</SelectItem>
                  <SelectItem value="50">50 uses</SelectItem>
                  <SelectItem value="100">100 uses</SelectItem>
                  <SelectItem value="999">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateAccessCode}
              disabled={generateAccessCode.isPending}
            >
              {generateAccessCode.isPending ? 'Generating...' : 'Generate Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
