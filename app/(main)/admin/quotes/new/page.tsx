'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useClients, useCreateQuote } from '@/lib/query/hooks'

interface QuoteItem {
  name: string
  description: string
  quantity: number
  unitPrice: number
}

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('clientId')

  // Use TanStack Query for clients
  const { data: clients = [], isLoading: isLoadingClients } = useClients()

  // Use TanStack Query mutation for creating quote
  const createQuote = useCreateQuote()

  const [formData, setFormData] = useState({
    clientId: preselectedClientId || '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 30 days from now
  })

  const [items, setItems] = useState<QuoteItem[]>([
    { name: '', description: '', quantity: 1, unitPrice: 0 },
  ])

  const [validationError, setValidationError] = useState('')

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // Validate items
    const validItems = items.filter((item) => item.name.trim() !== '' && item.unitPrice > 0)
    if (validItems.length === 0) {
      setValidationError('Please add at least one item with a name and price')
      return
    }

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

  const error = validationError || (createQuote.error?.message ?? '')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-heading text-foreground">New Quote</h2>
        <Link href="/admin/quotes">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Quote Details */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <select
                  id="clientId"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleFormChange}
                  required
                  disabled={isLoadingClients}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 text-foreground"
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName} ({client.contactName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={handleFormChange}
                  required
                  className="bg-background text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-card">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="Service or product name"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Optional description"
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price (PHP) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Line Total</Label>
                    <div className="h-10 flex items-center px-3 bg-muted rounded-md border text-sm font-medium text-foreground">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(calculateTotal())}</p>
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
