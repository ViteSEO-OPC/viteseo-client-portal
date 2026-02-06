'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Check, X, Download, Calendar, Building, Mail, User } from 'lucide-react'
import { useAcceptQuote, useRejectQuote, useGeneratePDF, setCSRFToken } from '@/lib/query'

interface QuoteItem {
  id: string
  name: string
  description: string | null
  quantity: number
  unitPrice: string
}

interface QuoteViewProps {
  client: {
    companyName: string
    contactName: string
    email: string
  }
  quote: {
    id: string
    quoteNumber: string
    version: number
    validUntil: string
    total: string
    status: 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
    items: QuoteItem[]
  }
  timezone: string
  csrfToken?: string | null
  isPreviewMode?: boolean
}

export function QuoteView({ client, quote, timezone, csrfToken, isPreviewMode = false }: QuoteViewProps) {
  const [quoteStatus, setQuoteStatus] = useState(quote.status)

  // Store CSRF token on mount
  useEffect(() => {
    if (csrfToken) {
      setCSRFToken(csrfToken)
    }
  }, [csrfToken])

  // TanStack Query mutations
  const acceptQuote = useAcceptQuote()
  const rejectQuote = useRejectQuote()
  const generatePDF = useGeneratePDF()

  const handleDownloadPDF = () => {
    generatePDF.mutate()
  }

  const handleAccept = () => {
    if (!confirm('Are you sure you want to accept this quote?')) return

    acceptQuote.mutate(undefined, {
      onSuccess: () => {
        setQuoteStatus('accepted')
      },
    })
  }

  const handleReject = () => {
    if (!confirm('Are you sure you want to reject this quote?')) return

    rejectQuote.mutate(undefined, {
      onSuccess: () => {
        setQuoteStatus('rejected')
      },
    })
  }

  const canTakeAction = !isPreviewMode && (quoteStatus === 'viewed' || quoteStatus === 'sent')
  const isExpired = new Date(quote.validUntil) < new Date()

  // Combine errors
  const error =
    acceptQuote.error?.message ||
    rejectQuote.error?.message ||
    generatePDF.error?.message ||
    ''

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Quotation</h1>
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-muted-foreground border border-white/5">
                    {quote.quoteNumber}
                </span>
            </div>
          {/* Status Badge */}
          <div className="mt-2">
            {quoteStatus === 'accepted' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                <Check className="w-3.5 h-3.5" /> Accepted
              </span>
            )}
            {quoteStatus === 'rejected' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                <X className="w-3.5 h-3.5" /> Rejected
              </span>
            )}
            {isExpired && quoteStatus !== 'accepted' && quoteStatus !== 'rejected' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Expired
              </span>
            )}
            {quoteStatus === 'viewed' && !isExpired && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Awaiting Action
                </span>
            )}
          </div>
        </div>
        {!isPreviewMode && (
          <Button
            onClick={handleDownloadPDF}
            disabled={generatePDF.isPending}
            variant="outline"
            className="border-white/10 hover:bg-white/5 text-foreground"
          >
              <Download className="w-4 h-4 mr-2" />
            {generatePDF.isPending ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Info */}
        <Card className="md:col-span-2 bg-zinc-900/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
            <CardTitle className="text-lg font-heading text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" /> Prepared For
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div>
                <p className="text-xl font-semibold text-white">{client.companyName}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{client.contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                </div>
            </div>
            </CardContent>
        </Card>

        {/* Validity */}
        <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-sm flex flex-col justify-center">
            <CardContent className="pt-6 space-y-2 text-center">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Valid Until</p>
                <p className="text-xl font-bold text-white">
                {formatDate(quote.validUntil, timezone)}
                </p>
            </CardContent>
        </Card>
      </div>

      {/* Quote Items */}
      <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5">
          <CardTitle className="text-lg font-heading text-white">Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground font-mono uppercase tracking-wider">Item</th>
                  <th className="text-right py-4 px-6 font-semibold text-sm text-muted-foreground font-mono uppercase tracking-wider">Qty</th>
                  <th className="text-right py-4 px-6 font-semibold text-sm text-muted-foreground font-mono uppercase tracking-wider">Unit Price</th>
                  <th className="text-right py-4 px-6 font-semibold text-sm text-muted-foreground font-mono uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {quote.items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-medium text-white">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </td>
                    <td className="text-right py-4 px-6 text-foreground font-mono">{item.quantity}</td>
                    <td className="text-right py-4 px-6 text-foreground font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="text-right py-4 px-6 text-foreground font-mono font-medium">
                      {formatCurrency(parseFloat(item.unitPrice) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5 border-t border-white/10">
                <tr>
                  <td colSpan={3} className="text-right py-6 px-6 font-bold text-lg text-white">
                    Total
                  </td>
                  <td className="text-right py-6 px-6 font-bold text-2xl text-primary font-mono">
                    {formatCurrency(quote.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>


      {/* Accept/Reject Actions */}
      {canTakeAction && !isExpired && (
        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
              <Button
                onClick={handleReject}
                disabled={acceptQuote.isPending || rejectQuote.isPending}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 h-12 px-8"
              >
                {rejectQuote.isPending ? 'Rejecting...' : 'Reject Quote'}
              </Button>
              <Button
                onClick={handleAccept}
                disabled={acceptQuote.isPending || rejectQuote.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-bold shadow-[0_0_20px_-5px_rgba(210,252,69,0.3)] hover:shadow-[0_0_30px_-5px_rgba(210,252,69,0.5)] transition-all"
              >
                {acceptQuote.isPending ? 'Accepting...' : 'Accept Quote'}
              </Button>
        </div>
      )}

      {/* Status Message for Actioned Quotes */}
      {quoteStatus === 'accepted' && (
        <Card className="border-green-500/30 bg-green-500/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                    <Check className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-green-400">Quote Accepted</h3>
                <p className="text-green-200/80 max-w-md">
                Thank you for accepting this quote. We have been notified and will be in touch shortly to proceed with the next steps.
                </p>
            </div>
          </CardContent>
        </Card>
      )}

      {quoteStatus === 'rejected' && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="pt-6">
             <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                    <X className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-400">Quote Rejected</h3>
                <p className="text-red-200/80 max-w-md">
                You have rejected this quote. If you would like to discuss alternatives or have any questions, please don&apos;t hesitate to contact us.
                </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground/40 pt-8 pb-4 uppercase tracking-widest font-mono">
        <p>Vite SEO Digital Advertising OPC &bull; Secure Client Portal</p>
      </div>
    </div>
  )
}
