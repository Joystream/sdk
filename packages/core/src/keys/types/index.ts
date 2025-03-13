import { Signer } from '@polkadot/api/types'
import { KeyringOptions } from '../keyring/Keyring'
import { KeyringPair, KeyringPair$Meta } from '@polkadot/keyring/types'

export type KeyType = KeyringPair['type']

export interface KeyInfo {
  address: string
  type?: KeyType
  name?: string
}

export type UnsubscribeFn = () => void

export interface KeyProvider {
  signer?: Signer
  getAccounts(): Promise<{ address: string }[]>
  subscribeAccounts(cb: (keys: KeyInfo[] | undefined) => void): unknown
}

export type KeyManagerConfig = {
  keyringOptions?: KeyringOptions
}

export type Key = KeyInfo & {
  provider: string
}

export type KeyringKey = {
  meta?: Omit<KeyringPair$Meta, 'source'>
  type?: KeyringPair['type']
}

export type MnemonicKey = KeyringKey & {
  mnemonic: string
}

export type SeedKey = KeyringKey & {
  seed: Uint8Array | Buffer | `0x${string}` | string
}

export type SuriKey = KeyringKey & {
  suri: string
}

export type AnyKeyringKey = MnemonicKey | SeedKey | SuriKey

export type KeySubscriptionCb = (keys: Key[]) => void
