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
import { StatusBadge } from '@/components/ui/data-table'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  useUpdateQuote,
  useSendQuote,
  useDeleteQuote,
  useAddQuoteItem,
  useUpdateQuoteItem,
  useDeleteQuoteItem,
  useGenerateAccessCode,
} from '@/lib/query/hooks'
import {
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  AlertTriangle,
  Send,
  Eye,
  ExternalLink,
  Copy,
  ArrowRight,
} from 'lucide-react'

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

// Status flow visualization data
const STATUS_FLOW = [
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'viewed', label: 'Viewed' },
  { key: 'final', label: 'Final' },
]

function getStatusVariant(status: string) {
  switch (status) {
    case 'accepted':
      return 'success' as const
    case 'sent':
    case 'viewed':
      return 'info' as const
    case 'rejected':
      return 'error' as const
    case 'expired':
      return 'warning' as const
    default:
      return 'default' as const
  }
}

function getStatusStep(status: string): number {
  switch (status) {
    case 'draft':
      return 0
    case 'sent':
      return 1
    case 'viewed':
      return 2
    case 'accepted':
    case 'rejected':
    case 'expired':
    case 'superseded':
      return 3
    default:
      return 0
  }
}

// Inline item edit form
interface EditItemFormData {
  name: string
  description: string
  quantity: number
  unitPrice: number
}

export function QuoteDetailView({ quote, activityLogs }: QuoteDetailViewProps) {
  const router = useRouter()

  // TanStack Query mutations
  const updateQuote = useUpdateQuote(quote.id)
  const sendQuote = useSendQuote(quote.id)
  const deleteQuote = useDeleteQuote()
  const addQuoteItem = useAddQuoteItem(quote.id)
  const updateQuoteItem = useUpdateQuoteItem(quote.id)
  const deleteQuoteItem = useDeleteQuoteItem(quote.id)
  const generateAccessCode = useGenerateAccessCode()

  const [formData, setFormData] = useState({
    validUntil: quote.validUntil.slice(0, 16),
    notes: quote.notes || '',
  })

  const [quoteStatus, setQuoteStatus] = useState(quote.status)
  const [generatedCode, setGeneratedCode] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  // Dialog states
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [codeExpiration, setCodeExpiration] = useState('720')
  const [codeMaxUses, setCodeMaxUses] = useState('100')

  // Inline item editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemForm, setEditItemForm] = useState<EditItemFormData>({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
  })
  const [showAddItemForm, setShowAddItemForm] = useState(false)
  const [newItemForm, setNewItemForm] = useState<EditItemFormData>({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
  })
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)

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
    setSuccessMessage('')
    setShowSendDialog(false)

    sendQuote.mutate(undefined, {
      onSuccess: () => {
        setQuoteStatus('sent')
        setSuccessMessage('Quote sent successfully')
        router.refresh()
      },
    })
  }

  const handleDeleteQuote = () => {
    setShowDeleteDialog(false)

    deleteQuote.mutate(quote.id, {
      onSuccess: () => {
        router.push('/admin/quotes')
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
      setSuccessMessage('')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Item CRUD handlers
  const startEditItem = (item: QuoteItem) => {
    setEditingItemId(item.id)
    setEditItemForm({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
    })
  }

  const cancelEditItem = () => {
    setEditingItemId(null)
  }

  const saveEditItem = () => {
    if (!editingItemId) return
    updateQuoteItem.mutate(
      {
        itemId: editingItemId,
        data: {
          name: editItemForm.name,
          description: editItemForm.description || undefined,
          quantity: editItemForm.quantity,
          unitPrice: editItemForm.unitPrice,
        },
      },
      {
        onSuccess: () => {
          setEditingItemId(null)
          setSuccessMessage('Item updated')
          router.refresh()
        },
      }
    )
  }

  const confirmDeleteItem = () => {
    if (!deleteItemId) return
    deleteQuoteItem.mutate(deleteItemId, {
      onSuccess: () => {
        setDeleteItemId(null)
        setSuccessMessage('Item deleted')
        router.refresh()
      },
    })
  }

  const handleAddItem = () => {
    if (!newItemForm.name.trim() || newItemForm.unitPrice <= 0) return
    addQuoteItem.mutate(
      {
        name: newItemForm.name,
        description: newItemForm.description || undefined,
        quantity: newItemForm.quantity,
        unitPrice: newItemForm.unitPrice,
      },
      {
        onSuccess: () => {
          setShowAddItemForm(false)
          setNewItemForm({ name: '', description: '', quantity: 1, unitPrice: 0 })
          setSuccessMessage('Item added')
          router.refresh()
        },
      }
    )
  }

  const [isExpired, setIsExpired] = useState(false)
  useEffect(() => {
    setIsExpired(new Date(quote.validUntil) < new Date())
  }, [quote.validUntil])

  const editableStatuses = ['draft', 'sent', 'viewed']
  const canEdit = editableStatuses.includes(quoteStatus)
  const canSend = quoteStatus === 'draft' && !isExpired
  const canDelete = quoteStatus === 'draft'
  const canGenerateCode = quoteStatus === 'sent' || quoteStatus === 'viewed'

  // Combine errors from mutations
  const error =
    updateQuote.error?.message ||
    sendQuote.error?.message ||
    deleteQuote.error?.message ||
    addQuoteItem.error?.message ||
    updateQuoteItem.error?.message ||
    deleteQuoteItem.error?.message ||
    generateAccessCode.error?.message ||
    ''

  const currentStep = getStatusStep(quoteStatus)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading text-foreground">{quote.quoteNumber}</h2>
          <p className="text-muted-foreground">
            For {quote.client.companyName}
            {quote.version > 1 && ` (Version ${quote.version})`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            label={quoteStatus}
            variant={getStatusVariant(quoteStatus)}
            aria-label={`Quote status: ${quoteStatus}`}
          />
          <Link href="/admin/quotes">
            <Button variant="outline">Back to Quotes</Button>
          </Link>
        </div>
      </div>

      {/* Status Flow Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            {STATUS_FLOW.map((step, i) => {
              const isActive = i <= currentStep
              const isCurrent = i === currentStep
              const finalLabel =
                i === 3
                  ? quoteStatus === 'accepted'
                    ? 'Accepted'
                    : quoteStatus === 'rejected'
                      ? 'Rejected'
                      : quoteStatus === 'expired'
                        ? 'Expired'
                        : quoteStatus === 'superseded'
                          ? 'Superseded'
                          : 'Final'
                  : step.label

              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                      }`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-xs mt-1 ${
                        isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {finalLabel}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-1rem] ${
                        i < currentStep ? 'bg-primary/40' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Status messaging */}
          {(quoteStatus === 'sent' || quoteStatus === 'viewed') && (
            <p className="text-sm text-yellow-400 text-center border-t pt-3 mt-2 flex items-center justify-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              This quote has been {quoteStatus === 'viewed' ? 'viewed by the client' : 'sent'}. Changes will be visible to the client immediately.
            </p>
          )}
          {!canEdit && (
            <p className="text-sm text-muted-foreground text-center border-t pt-3 mt-2">
              {quoteStatus === 'accepted'
                ? 'This quote has been accepted by the client and cannot be modified.'
                : quoteStatus === 'rejected'
                  ? 'This quote has been rejected and cannot be modified.'
                  : quoteStatus === 'expired'
                    ? 'This quote has expired. Create a new version to continue.'
                    : 'This quote cannot be modified in its current state.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg" role="alert">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {successMessage && (
        <div
          className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-green-400">{successMessage}</p>
        </div>
      )}

      {generatedCode && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg" role="status">
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
              aria-label="Copy access code to clipboard"
            >
              <Copy className="h-4 w-4 mr-1" />
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
          <div className="flex flex-wrap gap-3">
            {canSend && (
              <Button
                onClick={() => setShowSendDialog(true)}
                disabled={sendQuote.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                aria-label="Send quote to client"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendQuote.isPending ? 'Sending...' : 'Send Quote'}
              </Button>
            )}
            {canGenerateCode && (
              <Button
                onClick={() => setShowCodeDialog(true)}
                variant="outline"
                aria-label="Generate access code for client"
              >
                Generate Access Code
              </Button>
            )}
            <Button
              onClick={handlePreviewPortal}
              disabled={previewLoading}
              variant="outline"
              aria-label="Preview portal in new tab"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {previewLoading ? 'Loading...' : 'Preview Portal'}
            </Button>
            {canDelete && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/30"
                disabled={deleteQuote.isPending}
                aria-label={`Delete quote ${quote.quoteNumber}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteQuote.isPending ? 'Deleting...' : 'Delete Quote'}
              </Button>
            )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <div className="h-10 flex items-center px-3 bg-muted rounded-md border border-input text-sm">
                  <Link
                    href={`/admin/clients/${quote.client.id}`}
                    className="text-primary hover:underline"
                  >
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
                  aria-describedby={isExpired ? 'validUntil-warning' : undefined}
                />
                {isExpired && (
                  <p id="validUntil-warning" className="text-sm text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    This quote has expired
                  </p>
                )}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddItemForm(true)}
              disabled={showAddItemForm}
              aria-label="Add new item"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-sm font-medium text-muted-foreground">Item</th>
                <th className="text-right py-2 text-sm font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-2 text-sm font-medium text-muted-foreground">Unit Price</th>
                <th className="text-right py-2 text-sm font-medium text-muted-foreground">Total</th>
                {canEdit && (
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground w-24">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="text-foreground">
              {quote.items.map((item) =>
                editingItemId === item.id ? (
                  <tr key={item.id} className="border-b border-border bg-muted/30">
                    <td className="py-3 pr-2">
                      <div className="space-y-1">
                        <Input
                          value={editItemForm.name}
                          onChange={(e) =>
                            setEditItemForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="Item name"
                          className="bg-background h-8 text-sm"
                          aria-label="Item name"
                        />
                        <Input
                          value={editItemForm.description}
                          onChange={(e) =>
                            setEditItemForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Description (optional)"
                          className="bg-background h-8 text-sm"
                          aria-label="Item description"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        min="1"
                        value={editItemForm.quantity}
                        onChange={(e) =>
                          setEditItemForm((prev) => ({
                            ...prev,
                            quantity: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="bg-background h-8 text-sm w-20 ml-auto text-right"
                        aria-label="Quantity"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={editItemForm.unitPrice || ''}
                        onChange={(e) =>
                          setEditItemForm((prev) => ({
                            ...prev,
                            unitPrice: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="bg-background h-8 text-sm w-28 ml-auto text-right"
                        aria-label="Unit price"
                      />
                    </td>
                    <td className="py-3 px-2 text-right text-sm text-muted-foreground">
                      {formatCurrency(editItemForm.quantity * editItemForm.unitPrice)}
                    </td>
                    <td className="py-3 pl-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveEditItem}
                          disabled={
                            updateQuoteItem.isPending ||
                            !editItemForm.name.trim() ||
                            editItemForm.unitPrice <= 0
                          }
                          className="h-7 w-7 p-0 text-green-500 hover:text-green-400"
                          aria-label="Save item changes"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditItem}
                          className="h-7 w-7 p-0"
                          aria-label="Cancel editing"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
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
                    {canEdit && (
                      <td className="py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditItem(item)}
                            className="h-7 w-7 p-0"
                            aria-label={`Edit item ${item.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteItemId(item.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-400"
                            aria-label={`Delete item ${item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              )}

              {/* Inline add item row */}
              {showAddItemForm && (
                <tr className="border-b border-border bg-muted/30">
                  <td className="py-3 pr-2">
                    <div className="space-y-1">
                      <Input
                        value={newItemForm.name}
                        onChange={(e) =>
                          setNewItemForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Item name *"
                        className="bg-background h-8 text-sm"
                        aria-label="New item name"
                        autoFocus
                      />
                      <Input
                        value={newItemForm.description}
                        onChange={(e) =>
                          setNewItemForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Description (optional)"
                        className="bg-background h-8 text-sm"
                        aria-label="New item description"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Input
                      type="number"
                      min="1"
                      value={newItemForm.quantity}
                      onChange={(e) =>
                        setNewItemForm((prev) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="bg-background h-8 text-sm w-20 ml-auto text-right"
                      aria-label="New item quantity"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newItemForm.unitPrice || ''}
                      onChange={(e) =>
                        setNewItemForm((prev) => ({
                          ...prev,
                          unitPrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0.00"
                      className="bg-background h-8 text-sm w-28 ml-auto text-right"
                      aria-label="New item unit price"
                    />
                  </td>
                  <td className="py-3 px-2 text-right text-sm text-muted-foreground">
                    {formatCurrency(newItemForm.quantity * newItemForm.unitPrice)}
                  </td>
                  <td className="py-3 pl-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddItem}
                        disabled={
                          addQuoteItem.isPending ||
                          !newItemForm.name.trim() ||
                          newItemForm.unitPrice <= 0
                        }
                        className="h-7 w-7 p-0 text-green-500 hover:text-green-400"
                        aria-label="Save new item"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddItemForm(false)
                          setNewItemForm({ name: '', description: '', quantity: 1, unitPrice: 0 })
                        }}
                        className="h-7 w-7 p-0"
                        aria-label="Cancel adding item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={canEdit ? 4 : 3} className="py-4 text-right font-bold text-foreground">
                  Total:
                </td>
                <td className={`py-4 text-right font-bold text-lg text-primary ${canEdit ? '' : ''}`}>
                  {formatCurrency(quote.total)}
                </td>
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
            <table className="w-full" role="table">
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
                  <tr
                    key={code.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm text-foreground">
                        ****{code.codeHint}
                      </code>
                    </td>
                    <td className="py-2" suppressHydrationWarning>
                      {code.revokedAt ? (
                        <StatusBadge label="Revoked" variant="error" aria-label="Status: Revoked" />
                      ) : new Date(code.expiresAt) < new Date() ? (
                        <StatusBadge label="Expired" variant="default" aria-label="Status: Expired" />
                      ) : (
                        <StatusBadge label="Active" variant="success" aria-label="Status: Active" />
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
              <dd className="font-medium text-foreground">
                {formatDate(quote.createdAt, quote.client.timezone)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium text-foreground">
                {formatDate(quote.updatedAt, quote.client.timezone)}
              </dd>
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

      {/* Send Quote Confirmation Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this quote to {quote.client.companyName}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              <span>The quote status will change to &quot;sent&quot;</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              <span>The quote can no longer be edited after sending</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              <span>You will need to generate an access code for the client to view it</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendQuote}
              disabled={sendQuote.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendQuote.isPending ? 'Sending...' : 'Send Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Quote Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Quote
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quote{' '}
              <span className="font-semibold text-foreground">{quote.quoteNumber}</span>? This
              action cannot be undone. All items and associated access codes will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteQuote}
              disabled={deleteQuote.isPending}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteQuote.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <Dialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from the quote? The quote total will be
              recalculated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemId(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteItem}
              disabled={deleteQuoteItem.isPending}
              variant="destructive"
            >
              {deleteQuoteItem.isPending ? 'Deleting...' : 'Delete Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Access Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Access Code</DialogTitle>
            <DialogDescription>
              Create an access code for {quote.client.companyName} to view quote{' '}
              {quote.quoteNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code-expiration">Expiration</Label>
              <Select value={codeExpiration} onValueChange={setCodeExpiration}>
                <SelectTrigger id="code-expiration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                  <SelectItem value="720">30 days</SelectItem>
                  <SelectItem value="2160">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code-max-uses">Max Uses</Label>
              <Select value={codeMaxUses} onValueChange={setCodeMaxUses}>
                <SelectTrigger id="code-max-uses">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
