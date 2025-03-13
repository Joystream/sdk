import { SS58_PREFIX } from '@joystream/sdk-core/chain/consts'
import { createTestKeyring, Keyring } from '@polkadot/keyring'
import {
  KeyringOptions as BaseKeyringOptions,
  KeyringInstance,
} from '@polkadot/keyring/types'

export type KeyringOptions = BaseKeyringOptions & {
  isDev?: boolean
}

export const DEFAULT_KEYRING_OPTIONS: KeyringOptions = {
  ss58Format: SS58_PREFIX,
}

export function createKeyring(options?: KeyringOptions): KeyringInstance {
  options = {
    ...DEFAULT_KEYRING_OPTIONS,
    ...options,
  }

  const keyring = options.isDev
    ? createTestKeyring(options)
    : new Keyring(options)

  return keyring
}
