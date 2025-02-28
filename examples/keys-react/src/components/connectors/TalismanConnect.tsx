import { Button, Icon } from '@mui/material'
import { WalletSelect } from '@talismn/connect-components'
import { Wallet } from '@talismn/connect-wallets'
import talismanIcon from '../../assets/TalismanIcon.png'

type TalismanModalProps = {
  onConnected(w: Wallet): void
}

export const TalismanConnectConnector: React.FC<TalismanModalProps> = ({
  onConnected,
}) => {
  return (
    <WalletSelect
      dappName="Joystream SDK keys example"
      triggerComponent={
        <Button
          variant="outlined"
          size="large"
          startIcon={<Icon component="img" src={talismanIcon} />}
          fullWidth
        >
          Talisman Connect
        </Button>
      }
      showAccountsList={false}
      onWalletSelected={(wallet) => onConnected(wallet)}
    />
  )
}

export default TalismanConnectConnector
