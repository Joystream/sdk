export function hasMessage(e: unknown): e is { message: string } {
  return !!(
    typeof e === 'object' &&
    e &&
    'message' in e &&
    typeof e.message === 'string'
  )
}
