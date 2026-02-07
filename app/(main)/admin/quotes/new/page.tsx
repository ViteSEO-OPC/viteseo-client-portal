'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClients, useCreateQuote } from '@/lib/query/hooks'
import { Plus, Trash2 } from 'lucide-react'

interface QuoteItem {
  name: string
  description: string
  quantity: number
  unitPrice: number
}

interface FieldErrors {
  clientId?: string
  validUntil?: string
  items?: Record<number, { name?: string; unitPrice?: string; quantity?: string }>
  general?: string
}

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('clientId')

  const { data: clients = [], isLoading: isLoadingClients } = useClients()
  const createQuote = useCreateQuote()

  const [formData, setFormData] = useState({
    clientId: preselectedClientId || '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  })

  const [items, setItems] = useState<QuoteItem[]>([
    { name: '', description: '', quantity: 1, unitPrice: 0 },
  ])

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    // Clear field-level error on change
    setFieldErrors((prev) => {
      const itemErrors = { ...prev.items }
      if (itemErrors[index]) {
        delete itemErrors[index][field as keyof typeof itemErrors[number]]
      }
      return { ...prev, items: itemErrors }
    })
  }

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  const validate = (): boolean => {
    const errors: FieldErrors = {}
    let valid = true

    if (!formData.clientId) {
      errors.clientId = 'Please select a client'
      valid = false
    }

    if (!formData.validUntil) {
      errors.validUntil = 'Please set a valid until date'
      valid = false
    } else if (new Date(formData.validUntil) <= new Date()) {
      errors.validUntil = 'Valid until date must be in the future'
      valid = false
    }

    const itemErrors: Record<number, { name?: string; unitPrice?: string; quantity?: string }> = {}
    let hasValidItem = false

    items.forEach((item, index) => {
      const errs: { name?: string; unitPrice?: string; quantity?: string } = {}
      if (!item.name.trim()) {
        errs.name = 'Name is required'
        valid = false
      }
      if (item.unitPrice <= 0) {
        errs.unitPrice = 'Price must be greater than 0'
        valid = false
      }
      if (item.quantity < 1) {
        errs.quantity = 'Quantity must be at least 1'
        valid = false
      }
      if (Object.keys(errs).length > 0) {
        itemErrors[index] = errs
      } else {
        hasValidItem = true
      }
    })

    if (!hasValidItem) {
      errors.general = 'At least one valid item is required'
      valid = false
    }

    if (Object.keys(itemErrors).length > 0) {
      errors.items = itemErrors
    }

    setFieldErrors(errors)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const validItems = items.filter((item) => item.name.trim() !== '' && item.unitPrice > 0)

    createQuote.mutate(
      {
        clientId: formData.clientId,
        validUntil: new Date(formData.validUntil).toISOString(),
        items: validItems,
      },
      {
        onSuccess: (data) => {
          router.push(`/admin/quotes/${data.id}`)
          router.refresh()
        },
      }
    )
  }

  const apiError = createQuote.error?.message ?? ''

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-heading text-foreground">New Quote</h2>
        <Link href="/admin/quotes">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Form-level error summary */}
        {(apiError || fieldErrors.general) && (
          <div
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-red-400">{apiError || fieldErrors.general}</p>
          </div>
        )}

        {/* Quote Details */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, clientId: value }))
                    setFieldErrors((prev) => ({ ...prev, clientId: undefined }))
                  }}
                  disabled={isLoadingClients}
                >
                  <SelectTrigger
                    id="clientId"
                    aria-invalid={!!fieldErrors.clientId}
                    aria-describedby={fieldErrors.clientId ? 'clientId-error' : undefined}
                  >
                    <SelectValue placeholder={isLoadingClients ? 'Loading clients...' : 'Select a client...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName} ({client.contactName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.clientId && (
                  <p id="clientId-error" className="text-sm text-red-400" role="alert">
                    {fieldErrors.clientId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, validUntil: e.target.value }))
                    setFieldErrors((prev) => ({ ...prev, validUntil: undefined }))
                  }}
                  aria-invalid={!!fieldErrors.validUntil}
                  aria-describedby={fieldErrors.validUntil ? 'validUntil-error' : undefined}
                  className="bg-background text-foreground"
                />
                {fieldErrors.validUntil && (
                  <p id="validUntil-error" className="text-sm text-red-400" role="alert">
                    {fieldErrors.validUntil}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => {
              const itemErrs = fieldErrors.items?.[index]
              return (
                <div key={index} className="p-4 border rounded-lg space-y-3 bg-card">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        aria-label={`Remove item ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`item-name-${index}`}>Name *</Label>
                      <Input
                        id={`item-name-${index}`}
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="Service or product name"
                        aria-invalid={!!itemErrs?.name}
                        aria-describedby={itemErrs?.name ? `item-name-${index}-error` : undefined}
                        className="bg-background"
                      />
                      {itemErrs?.name && (
                        <p id={`item-name-${index}-error`} className="text-sm text-red-400" role="alert">
                          {itemErrs.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-desc-${index}`}>Description</Label>
                      <Input
                        id={`item-desc-${index}`}
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Optional description"
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`item-qty-${index}`}>Quantity *</Label>
                      <Input
                        id={`item-qty-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                        }
                        aria-invalid={!!itemErrs?.quantity}
                        aria-describedby={itemErrs?.quantity ? `item-qty-${index}-error` : undefined}
                        className="bg-background"
                      />
                      {itemErrs?.quantity && (
                        <p id={`item-qty-${index}-error`} className="text-sm text-red-400" role="alert">
                          {itemErrs.quantity}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-price-${index}`}>Unit Price (PHP) *</Label>
                      <Input
                        id={`item-price-${index}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        aria-invalid={!!itemErrs?.unitPrice}
                        aria-describedby={itemErrs?.unitPrice ? `item-price-${index}-error` : undefined}
                        className="bg-background"
                      />
                      {itemErrs?.unitPrice && (
                        <p id={`item-price-${index}-error`} className="text-sm text-red-400" role="alert">
                          {itemErrs.unitPrice}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Line Total</Label>
                      <div className="h-10 flex items-center px-3 bg-muted rounded-md border text-sm font-medium text-foreground">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Total */}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(calculateTotal())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/admin/quotes">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createQuote.isPending}>
            {createQuote.isPending ? 'Creating...' : 'Create Quote'}
          </Button>
        </div>
      </form>
    </div>
  )
}
