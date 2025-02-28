import React, { PropsWithChildren, useContext, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  TextField,
  Typography,
} from '@mui/material'
import { KeyManagerContext } from '../providers/keys'

type SignMessageModalProps = {
  selectedKey?: string
  open: boolean
  onClose: () => void
}

type FormBoxProps = {
  subtitle?: string
  content?: string
}

const FormBox: React.FC<PropsWithChildren<FormBoxProps>> = ({
  children,
  subtitle,
  content,
}) => (
  <Box sx={{ bgcolor: 'grey.100', width: '100%' }} paddingX={1.5} paddingY={1}>
    {subtitle && (
      <Typography
        variant="subtitle2"
        component="h3"
        sx={{ fontSize: '0.75rem' }}
        color="text.secondary"
        gutterBottom
      >
        {subtitle}
      </Typography>
    )}
    {content && (
      <Typography
        variant="body1"
        component="div"
        gutterBottom
        color="text.primary"
        sx={{
          wordBreak: 'break-word',
          wordWrap: 'break-word',
        }}
      >
        {content}
      </Typography>
    )}
    {children}
  </Box>
)

export const SignMessageModal: React.FC<SignMessageModalProps> = ({
  selectedKey,
  open,
  onClose,
}) => {
  const [error, setError] = useState<string>('')
  const [message, setMessage] = useState<string>('Some example message')
  const [signature, setSignature] = useState<string>('')
  const [signing, setSigning] = useState(false)
  const { keyManager } = useContext(KeyManagerContext)

  const handleSign = async () => {
    if (keyManager && selectedKey) {
      setSigning(true)
      setError('')
      try {
        const signature = await keyManager.signMessage(message, selectedKey)
        setSignature(signature || '')
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError('Unknown error occured')
          console.error(e)
        }
      } finally {
        setSigning(false)
      }
    }
  }

  const handleClose = async () => {
    onClose()
    setSignature('')
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Sign a message</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <FormBox subtitle="Selected key" content={selectedKey} />
          <TextField
            fullWidth
            label="Messsage"
            variant="filled"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
          />
          {signature && <FormBox subtitle="Signature" content={signature} />}
          {error && (
            <Alert
              sx={{ width: '100%', paddingX: 1.5, paddingY: 1 }}
              icon={false}
              severity="error"
            >
              <Typography
                variant="subtitle2"
                component="h3"
                sx={{ fontSize: '0.75rem', opacity: 0.75 }}
                gutterBottom
              >
                Error
              </Typography>
              {error}
            </Alert>
          )}
          <Button
            variant="contained"
            onClick={handleSign}
            disabled={!keyManager || !selectedKey}
            loading={signing}
            fullWidth
          >
            Sign
          </Button>
        </Grid>
      </DialogContent>
    </Dialog>
  )
}

export default SignMessageModal
