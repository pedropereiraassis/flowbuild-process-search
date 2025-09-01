/** Extract key = last non-numeric token from path. Ex: 'bag.getData.0.userId' -> 'userId' */
export function leafKeyFromPath(path: string): string {
  const parts = path.split('.')

  for (let i = parts.length - 1; i >= 0; i--) {
    const token = parts[i]
    if (!/^\d+$/.test(token)) {
      return token
    }
  }

  return path
}
