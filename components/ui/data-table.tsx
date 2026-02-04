'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface Column<T> {
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
      <div className="text-muted-foreground text-center py-8">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'py-3 px-2 font-semibold text-muted-foreground',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  (!column.align || column.align === 'left') && 'text-left'
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'py-3 px-2',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : (item as Record<string, unknown>)[column.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
    <div className="flex justify-center gap-2 mt-6">
      {currentPage > 1 && (
        <a
          href={buildUrl(currentPage - 1)}
          className="px-3 py-1 border border-border rounded text-sm hover:bg-muted text-foreground"
        >
          Previous
        </a>
      )}
      <span className="px-3 py-1 text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <a
          href={buildUrl(currentPage + 1)}
          className="px-3 py-1 border border-border rounded text-sm hover:bg-muted text-foreground"
        >
          Next
        </a>
      )}
    </div>
  )
}

interface StatusBadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  className?: string
}

const variantStyles = {
  success: 'bg-green-500/15 text-green-500',
  warning: 'bg-yellow-500/15 text-yellow-500',
  error: 'bg-red-500/15 text-red-500',
  info: 'bg-blue-500/15 text-blue-500',
  default: 'bg-muted text-muted-foreground',
}

export function StatusBadge({
  label,
  variant = 'default',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-1 text-xs font-medium rounded',
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
