'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useGenerateAccessCode } from '@/lib/query/hooks'

interface ClientOption {
  id: string
  companyName: string
  quotes: { id: string; quoteNumber: string; status: string }[]
}

export function GenerateCodeDialog({ clients }: { clients: ClientOption[] }) {
  const router = useRouter()
  const generateAccessCode = useGenerateAccessCode()

  const [open, setOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [expiration, setExpiration] = useState('720')
  const [maxUses, setMaxUses] = useState('100')
  const [generatedCode, setGeneratedCode] = useState('')
  const [portalUrl, setPortalUrl] = useState('')

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const availableQuotes = selectedClient?.quotes ?? []

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    setSelectedQuoteId('')
    setGeneratedCode('')
  }

  const handleGenerate = () => {
    if (!selectedClientId || !selectedQuoteId) return

    generateAccessCode.mutate(
      {
        clientId: selectedClientId,
        quoteId: selectedQuoteId,
        expiresInHours: parseInt(expiration),
        maxUses: parseInt(maxUses),
      },
      {
        onSuccess: (data) => {
          setGeneratedCode(data.code)
          setPortalUrl(data.portalUrl)
          router.refresh()
        },
      }
    )
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedClientId('')
      setSelectedQuoteId('')
      setGeneratedCode('')
      setPortalUrl('')
      setExpiration('720')
      setMaxUses('100')
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Access Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Access Code</DialogTitle>
          <DialogDescription>
            Create a new access code for a client to view their quote.
          </DialogDescription>
        </DialogHeader>

        {generatedCode ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 mb-2">Access code generated! Share this with the client:</p>
              <div className="flex items-center gap-4">
                <code className="bg-background px-4 py-2 rounded border border-border text-lg font-mono font-bold text-foreground">
                  {generatedCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                >
                  Copy
                </Button>
              </div>
              {portalUrl && (
                <p className="text-xs text-green-400/80 mt-2">
                  Portal URL: {portalUrl}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={selectedClientId} onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200] bg-zinc-900 border-zinc-700 shadow-2xl">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClientId && (
                <div className="space-y-2">
                  <Label>Quote</Label>
                  {availableQuotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sent/viewed quotes for this client.</p>
                  ) : (
                    <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a quote" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[200] bg-zinc-900 border-zinc-700 shadow-2xl">
                        {availableQuotes.map((quote) => (
                          <SelectItem key={quote.id} value={quote.id}>
                            {quote.quoteNumber} ({quote.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Expiration</Label>
                <Select value={expiration} onValueChange={setExpiration}>
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
                <Select value={maxUses} onValueChange={setMaxUses}>
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

            {generateAccessCode.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{generateAccessCode.error.message}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!selectedClientId || !selectedQuoteId || generateAccessCode.isPending}
              >
                {generateAccessCode.isPending ? 'Generating...' : 'Generate Code'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
