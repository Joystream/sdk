import React, { useContext, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid2 as Grid,
  Icon,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import _ from 'lodash'
import { KeyManagerContext } from '../../providers/keys'
import { KeyType } from '@joystream/sdk-core/keys/types'
import polkadotIcon from '../../assets/PolkadotIcon.svg'

type ImportSource = 'mnemonic' | 'seed' | 'suri'

const DEFAULTS = {
  'mnemonic':
    'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
  'suri': '//Alice',
  'seed': '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
}

export const DirectImportConnector: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false)
  const [importSource, setImportSource] = useState<ImportSource>('suri')
  const [importType, setImportType] = useState<KeyType>('sr25519')
  const [importValue, setImportValue] = useState<string>(DEFAULTS['suri'])
  const { keyManager } = useContext(KeyManagerContext)

  const handleImportKey = () => {
    if (importSource === 'mnemonic') {
      keyManager?.addKey({ mnemonic: importValue, type: importType })
    }
    if (importSource === 'seed') {
      keyManager?.addKey({ seed: importValue, type: importType })
    }
    if (importSource === 'suri') {
      keyManager?.addKey({ suri: importValue, type: importType })
    }
    setOpen(false)
    setImportValue(DEFAULTS[importSource])
  }

  const onChangeType = (t: ImportSource) => {
    setImportSource(t)
    setImportValue(DEFAULTS[t])
  }

  return (
    <>
      <Button
        variant="outlined"
        fullWidth
        size="large"
        onClick={() => setOpen(true)}
        startIcon={<Icon component="img" src={polkadotIcon} />}
      >
        Direct import
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add a key</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} paddingY={2}>
            <FormControl fullWidth>
              <InputLabel id="import-source-label" variant="standard">
                From
              </InputLabel>
              <Select
                labelId="import-source-label"
                id="import-source-select"
                value={importSource}
                label="From"
                variant="standard"
                onChange={(e) => onChangeType(e.target.value as ImportSource)}
              >
                <MenuItem value={'suri'}>Suri</MenuItem>
                <MenuItem value={'seed'}>Seed</MenuItem>
                <MenuItem value={'mnemonic'}>Mnemonic</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="import-type-label" variant="standard">
                Type
              </InputLabel>
              <Select
                labelId="import-type-label"
                id="import-type-select"
                value={importType}
                label="Type"
                variant="standard"
                onChange={(e) => setImportType(e.target.value as KeyType)}
              >
                <MenuItem value={'sr25519'}>sr25519</MenuItem>
                <MenuItem value={'ed25519'}>ed25519</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={_.startCase(importSource)}
              variant="standard"
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              multiline
            />
            <Button variant="contained" onClick={handleImportKey} fullWidth>
              Import key
            </Button>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DirectImportConnector
