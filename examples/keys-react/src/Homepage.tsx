import React, { useContext, useState } from 'react'
import { KeyManagerContext, useKeys } from './providers/keys'
import {
  Container,
  Grid2 as Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import { Draw } from '@mui/icons-material'
import SignMessageModal from './components/SignMessageModal'
import {
  DirectImportConnector,
  TalismanConnectConnector,
  WalletConnectConnector,
} from './components/connectors'

export const Homepage: React.FC = () => {
  const { keyManager } = useContext(KeyManagerContext)
  const { keys } = useKeys()

  const [signModalKey, setSignModalKey] = useState<string>('')
  const [signModalOpen, setSignModalOpen] = useState(false)

  const handleSignClick = (key: string) => {
    setSignModalKey(key)
    setSignModalOpen(true)
  }

  return (
    <Container>
      <SignMessageModal
        open={signModalOpen}
        selectedKey={signModalKey}
        onClose={() => setSignModalOpen(false)}
      />
      <Grid container spacing={2} paddingY={2}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h3" component="h1" align="center">
            Connect your keys
          </Typography>
        </Grid>
        {keyManager && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <WalletConnectConnector
                onConnected={(wcWallet) =>
                  keyManager.addKeysProvider('WalletConnect', wcWallet)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TalismanConnectConnector
                onConnected={(wallet) => {
                  keyManager.addKeysProvider(wallet.extensionName, wallet)
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DirectImportConnector />
            </Grid>
          </>
        )}
        <Grid size={{ xs: 12 }}>
          <List dense>
            {keys.map((k, i) => (
              <ListItem key={k.address} divider={i !== keys.length - 1}>
                <ListItemText primary={k.address} secondary={k.provider} />
                <ListItemIcon>
                  <IconButton
                    edge="end"
                    aria-label="sign"
                    color="primary"
                    onClick={() => handleSignClick(k.address)}
                  >
                    <Draw />
                  </IconButton>
                </ListItemIcon>
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Homepage
