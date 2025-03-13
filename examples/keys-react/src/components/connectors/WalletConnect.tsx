import React, { useCallback, useRef, useState } from 'react'
import { ModalClosedError } from '@joystream/sdk-core/keys/integrations/wallet-connect/errors'
import { Button, Icon } from '@mui/material'
import { LinkOff } from '@mui/icons-material'
import {
  POLKADOT_CHAIN_ID,
  WalletConnect,
} from '@joystream/sdk-core/keys/integrations/wallet-connect'
import { ModalUxHandler } from '@joystream/sdk-core/keys/integrations/wallet-connect/ux'
import { WalletConnectModal } from '@walletconnect/modal'
import wcIcon from '../../assets/WalletConnectIcon.svg'

type WalletConnectConnectorProps = {
  onConnected(w: WalletConnect): void
}

export const WalletConnectConnector: React.FC<WalletConnectConnectorProps> = ({
  onConnected,
}) => {
  const wcProjectId = process.env.REACT_APP_WC_PROJECT_ID

  const [connected, setConnected] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const walletConnect = useRef<WalletConnect | null>(null)
  const wcModal = useRef<WalletConnectModal | null>(null)

  const connect = useCallback(async () => {
    if (!wcProjectId) {
      return
    }
    setLoading(true)

    if (!wcModal.current) {
      wcModal.current = new WalletConnectModal({
        projectId: wcProjectId,
        chains: [POLKADOT_CHAIN_ID],
      })
    }

    if (!walletConnect.current) {
      walletConnect.current = new WalletConnect(
        {
          projectId: wcProjectId,
          relayUrl: 'wss://relay.walletconnect.com',
        },
        new ModalUxHandler(wcModal.current)
      )
    }

    const unsub = wcModal.current.subscribeModal((state) => {
      if (state.open === true) {
        unsub()
        setLoading(false)
      }
    })

    try {
      await walletConnect.current.connect()
      setConnected(true)
    } catch (error) {
      if (error instanceof ModalClosedError) {
        return
      }
    }

    setLoading(false)
    onConnected(walletConnect.current)
  }, [walletConnect, wcModal, onConnected])

  const disconnect = useCallback(async () => {
    if (walletConnect.current) {
      await walletConnect.current.disconnect()
      setConnected(false)
    }
  }, [walletConnect])

  if (!wcProjectId) {
    return (
      <div>
        You need to set REACT_APP_WC_PROJECT_ID environment variable in order to
        run this example!
      </div>
    )
  }

  return (
    <Button
      variant="outlined"
      size="large"
      color={connected ? 'error' : 'primary'}
      fullWidth
      onClick={connected ? disconnect : connect}
      loading={loading}
      startIcon={<Icon component="img" src={wcIcon} />}
      endIcon={connected ? <LinkOff /> : undefined}
    >
      {connected ? 'Disconnect WalletConnect' : 'WalletConnect'}
    </Button>
  )
}

export default WalletConnectConnector
