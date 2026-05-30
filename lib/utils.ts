import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value ?? 0))
}

/** Parse a whole-number currency amount (no decimals). Returns null if invalid. */
export function parseWholeAmount(value: unknown): number | null {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
    return null
  }
  return num
}

/** Parse a whole-number amount that may be zero (e.g. advance paid). */
export function parseNonNegativeWholeAmount(value: unknown): number | null {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0 || !Number.isInteger(num)) {
    return null
  }
  return num
}

/** Split a whole amount across installments, distributing remainder to earlier ones. */
export function splitWholeAmount(total: number, parts: number): number[] {
  if (parts <= 0 || total < 0) {
    return []
  }

  const base = Math.floor(total / parts)
  const remainder = total % parts

  return Array.from({ length: parts }, (_, index) =>
    base + (index < remainder ? 1 : 0),
  )
}

export function wholeNumberInput(value: string) {
  return value.replace(/[^\d]/g, '')
}
