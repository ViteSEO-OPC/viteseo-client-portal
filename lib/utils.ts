import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateQuoteNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `Q-${year}-${random}`
}

export function formatCurrency(amount: number | string | { toString(): string }, currency = 'PHP'): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount.toString())
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
  }).format(num)
}

export function formatDate(date: Date | string, timezone = 'UTC'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: timezone,
  }).format(d)
}

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}
