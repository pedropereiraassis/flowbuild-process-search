import { GenericObject } from '@src/config/types'

export function normalizeValueToText(
  v?: string | number | boolean | GenericObject
): string {
  if (v === null || v === undefined) {
    return String(v)
  }

  if (typeof v === 'string') {
    return v.trim()
  }

  if (typeof v === 'number' || typeof v === 'boolean') {
    return String(v)
  }

  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
