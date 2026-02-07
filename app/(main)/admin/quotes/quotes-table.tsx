'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react'

const QUOTE_STATUSES = [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
  'superseded',
] as const

const PAGE_SIZE = 10

type SortKey = 'quoteNumber' | 'client' | 'total' | 'status' | 'validUntil' | 'createdAt'
type SortDir = 'asc' | 'desc'

interface QuotesTableProps {
  data: any[]
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'accepted':
      return 'success'
    case 'sent':
    case 'viewed':
      return 'info'
    case 'rejected':
      return 'error'
    case 'expired':
      return 'warning'
    default:
      return 'default'
  }
}

export function QuotesTable({ data }: QuotesTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  // Filter
  const filtered = useMemo(() => {
    let result = data

    // Search by quote number or client name
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (quote) =>
          quote.quoteNumber.toLowerCase().includes(q) ||
          quote.client.companyName.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((quote) => quote.status === statusFilter)
    }

    return result
  }, [data, search, statusFilter])

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'quoteNumber':
          cmp = a.quoteNumber.localeCompare(b.quoteNumber)
          break
        case 'client':
          cmp = a.client.companyName.localeCompare(b.client.companyName)
          break
        case 'total':
          cmp = parseFloat(a.total) - parseFloat(b.total)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'validUntil':
          cmp = new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime()
          break
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset page when filters change
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5" />
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No quotes yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Create your first quote to get started. Quotes can be sent to clients
          with access codes for secure viewing.
        </p>
        <Link href="/admin/quotes/new">
          <Button>Create your first quote</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by quote number or client..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-background"
            aria-label="Search quotes"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {QUOTE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length === data.length
          ? `${data.length} quote${data.length !== 1 ? 's' : ''}`
          : `${filtered.length} of ${data.length} quotes`}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-muted-foreground text-center py-12 border rounded-md bg-background">
          No quotes match your search criteria.
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center font-medium hover:text-foreground transition-colors"
                    onClick={() => toggleSort('quoteNumber')}
                    aria-label="Sort by quote number"
                  >
                    Quote # <SortIcon column="quoteNumber" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center font-medium hover:text-foreground transition-colors"
                    onClick={() => toggleSort('client')}
                    aria-label="Sort by client"
                  >
                    Client <SortIcon column="client" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    className="inline-flex items-center font-medium hover:text-foreground transition-colors ml-auto"
                    onClick={() => toggleSort('total')}
                    aria-label="Sort by total"
                  >
                    Total <SortIcon column="total" />
                  </button>
                </TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">
                  <button
                    type="button"
                    className="inline-flex items-center font-medium hover:text-foreground transition-colors mx-auto"
                    onClick={() => toggleSort('status')}
                    aria-label="Sort by status"
                  >
                    Status <SortIcon column="status" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center font-medium hover:text-foreground transition-colors"
                    onClick={() => toggleSort('validUntil')}
                    aria-label="Sort by valid until"
                  >
                    Valid Until <SortIcon column="validUntil" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{quote.quoteNumber}</p>
                      {quote.version > 1 && (
                        <p className="text-xs text-muted-foreground">v{quote.version}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{quote.client.companyName}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-foreground">
                      {formatCurrency(quote.total.toString())}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-foreground">{quote._count?.items ?? quote.items?.length ?? 0}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge
                      label={quote.status}
                      variant={getStatusVariant(quote.status)}
                      aria-label={`Status: ${quote.status}`}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {formatDate(quote.validUntil)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/quotes/${quote.id}`}>
                      <Button variant="ghost" size="sm" aria-label={`View quote ${quote.quoteNumber}`}>
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
