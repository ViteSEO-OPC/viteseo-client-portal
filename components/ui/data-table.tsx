'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data found',
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-12 border rounded-md bg-background">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn('rounded-md border bg-background', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={keyExtractor(item)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : (item as any)[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  queryParams?: Record<string, string | undefined>
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  queryParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null

  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', page.toString())
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return `${baseUrl}?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          asChild
        >
          <Link href={currentPage <= 1 ? '#' : buildUrl(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          asChild
        >
          <Link href={currentPage >= totalPages ? '#' : buildUrl(currentPage + 1)}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  className?: string
}

const variantStyles = {
  success: 'bg-green-500/15 text-green-500 hover:bg-green-500/25',
  warning: 'bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25',
  error: 'bg-red-500/15 text-red-500 hover:bg-red-500/25',
  info: 'bg-blue-500/15 text-blue-500 hover:bg-blue-500/25',
  default: 'bg-muted text-muted-foreground hover:bg-muted/80',
}

export function StatusBadge({
  label,
  variant = 'default',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
