import type { Signer } from '@polkadot/types/types'
import Client, { SignClient } from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'
import { MAINNET_GENESIS_HASH } from '@joystream/sdk-core/chain/consts'
import { WalletConnectSigner } from './signer'
import {
  WalletConnectConfiguration,
  WcAccount,
  WalletMetadata,
  SubscriptionCallback,
} from './types'
import { UxHandler } from './ux/UxHandler'
import { genesisHashToChainId, toWalletAccount } from './utils'
import { WalletConnectError } from './errors'
import { KeyInfo, KeyProvider, UnsubscribeFn } from '../../types'
import { uniqueId, remove } from 'lodash'

export * from './utils'
export * from './signer'
export const POLKADOT_CHAIN_ID = 'polkadot:91b171bb158e2d3848fa23a9f1c25182'
export const WC_VERSION = '2.0'

type SubscriptionHandlerFn = () => Promise<void>

export class WalletConnect implements KeyProvider {
  metadata: WalletMetadata
  config: WalletConnectConfiguration
  chainId: `polkadot:${string}`
  client: Client | undefined
  signer: Signer | undefined
  session: SessionTypes.Struct | undefined
  uxHandler: UxHandler
  _subscriptions: [string, SubscriptionHandlerFn][] = []

  constructor(config: WalletConnectConfiguration, uxHandler: UxHandler) {
    this.config = config
    this.uxHandler = uxHandler
    this.chainId =
      this.config.chainId || genesisHashToChainId(MAINNET_GENESIS_HASH)
    this.metadata = {
      id: 'wallet-connect',
      title: config.metadata?.name || 'Wallet Connect',
      description: config.metadata?.description || '',
      urls: { main: config.metadata?.url || '' },
      iconUrl: config.metadata?.icons[0] || '',
      version: WC_VERSION,
    }
  }

  reset(): void {
    this.client = undefined
    this.session = undefined
    this.signer = undefined
  }

  async getAccounts(): Promise<KeyInfo[]> {
    let accounts: KeyInfo[] = []

    if (this.session) {
      const wcAccounts = Object.values(this.session.namespaces)
        .map((namespace) => namespace.accounts)
        .flat()

      accounts = wcAccounts.map((wcAccount) =>
        toWalletAccount(wcAccount as WcAccount)
      )
    }

    return accounts
  }

  private announceAccountsUpdate() {
    for (const [, handler] of this._subscriptions) {
      handler()
    }
  }

  async subscribeAccounts(cb: SubscriptionCallback): Promise<UnsubscribeFn> {
    const handler = async () => {
      cb(await this.getAccounts())
    }

    const subId = uniqueId()
    this._subscriptions.push([subId, handler])

    await handler()

    this.client?.on('session_delete', handler)
    this.client?.on('session_expire', handler)
    this.client?.on('session_update', handler)

    return () => {
      this.client?.off('session_update', handler)
      this.client?.off('session_expire', handler)
      this.client?.off('session_update', handler)
      remove(this._subscriptions, ([id]) => id === subId)
    }
  }

  async connect() {
    this.reset()

    this.client = await SignClient.init(this.config)

    this.client.on('session_delete', () => {
      this.reset()

      if (this.config.onSessionDelete) {
        this.config.onSessionDelete()
      }
    })

    const namespaces = {
      requiredNamespaces: {
        polkadot: {
          chains: [this.chainId],
          methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
          events: [],
        },
      },
    }

    const lastKeyIndex = this.client.session.getAll().length - 1
    const lastSession = this.client.session.getAll()[lastKeyIndex]

    if (lastSession) {
      return new Promise<void>((resolve) => {
        this.session = lastSession

        this.signer = new WalletConnectSigner(
          this.client!,
          lastSession,
          this.chainId
        )
        resolve()
      })
    }

    const { uri, approval } = await this.client.connect(namespaces)

    if (!uri) {
      throw new WalletConnectError(`Couldn't acquire WalletConnect uri`)
    }

    return new Promise<void>((resolve, reject) => {
      this.uxHandler.requestConnect(uri, reject)

      approval()
        .then((session) => {
          this.session = session
          this.signer = new WalletConnectSigner(
            this.client!,
            session,
            this.chainId
          )

          resolve()
        })
        .catch((error) => {
          reject(new WalletConnectError(error.message))
        })
        .finally(() => this.uxHandler.onFinalized?.())
    })
  }

  async disconnect() {
    if (this.session?.topic) {
      await this.client?.disconnect({
        topic: this.session?.topic,
        reason: {
          code: -1,
          message: 'Disconnected by client!',
        },
      })
    }

    this.reset()
    this.announceAccountsUpdate()
  }

  isConnected() {
    return !!(this.client && this.signer && this.session)
  }
}
