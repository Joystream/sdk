export class WalletConnectError extends Error {}

export class ModalClosedError extends WalletConnectError {
  constructor() {
    super('WalletConnect modal was closed before any wallet was connected')
  }
}
