export interface UxHandler {
  requestConnect: (uri: string, reject: () => void) => void
  onFinalized?: () => void
}
