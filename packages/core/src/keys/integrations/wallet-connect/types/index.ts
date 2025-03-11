import { SignClientTypes } from '@walletconnect/types'
import { KeyInfo } from '../../../types'

export interface WalletMetadata {
  id: string
  title: string
  description?: string
  urls?: { main?: string; browsers?: Record<string, string> }
  iconUrl?: string
  version?: string
}

export type WcAccount = `${string}:${string}:${string}`

export type PolkadotNamespaceChainId = `polkadot:${string}`

interface ModalState {
  open: boolean
}

export type ConnectionModal = {
  openModal: () => Promise<void>
  subscribeModal: (callback: (state: ModalState) => void) => () => void
  closeModal: () => void
}

export interface WalletConnectConfiguration extends SignClientTypes.Options {
  chainId?: PolkadotNamespaceChainId
  onSessionDelete?: () => void
}

export type SubscriptionCallback = (keys: KeyInfo[]) => void

export type SubscriptionHandlerFn = () => Promise<void>
