/* eslint-disable @typescript-eslint/no-explicit-any */
import { GenericObject } from '@src/config/types'

export function flattenToLeaves(
  obj: GenericObject,
  prefix = ''
): { path: string; value: any }[] {
  const out: { path: string; value: any }[] = []

  if (obj === undefined) {
    return out
  }

  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    out.push({ path: prefix || 'value', value: obj })

    return out
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      out.push({ path: prefix || 'value', value: [] })

      return out
    }

    for (let i = 0; i < obj.length; i++) {
      const item = obj[i]
      const path = prefix ? `${prefix}.${i}` : String(i)

      out.push(...flattenToLeaves(item, path))
    }

    return out
  }

  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k

    out.push(...flattenToLeaves(v, path))
  }

  return out
}
