import { WcAccount } from './types'

export const genesisHashToChainId = (
  genesisHash: string
): `polkadot:${string}` => {
  return `polkadot:${genesisHash.replace('0x', '').substring(0, 32)}`
}

export const toWalletAccount = (wcAccount: WcAccount) => ({
  address: wcAccount.split(':')[2],
})
