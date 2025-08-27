import { GenericObject } from "@src/config/types"

export function flattenJSONToString(data: GenericObject | GenericObject[]): string {
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => flattenJSONToString(item)).join(' ')
    } else {
      const parts: string[] = []

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key]
          const flattenedValue = flattenJSONToString(value)
          parts.push(`${key} ${flattenedValue}`)
        }
      }

      return parts.join(' ').trim()
    }
  } else {
    return String(data).trim()
  }
}
