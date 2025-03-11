import { config } from 'dotenv'
import { KeyManager } from '@joystream/sdk-core/keys'
import QrCode from 'qrcode'
import path from 'path'
import { fileURLToPath } from 'url'
import { input, select } from '@inquirer/prompts'
import { signatureVerify } from '@polkadot/util-crypto'
import { UxHandler } from '@joystream/sdk-core/keys/integrations/wallet-connect/ux'
import { WalletConnect } from '@joystream/sdk-core/keys/integrations/wallet-connect'

// __dirname is missing in ESM context
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  config({ path: path.join(__dirname, '..', '.env') })

  const { PROJECT_ID } = process.env

  if (!PROJECT_ID) {
    console.error(
      'Create a .env file with PROJECT_ID={your_reown_project_id} in order to run this script.'
    )
    process.exit(1)
  }

  const keyManager = new KeyManager()

  await keyManager.ready()

  const wxUxHandler: UxHandler = {
    requestConnect(uri: string) {
      QrCode.toString(uri)
        .then((code) => {
          console.log(code)
          console.log('Scan the displayed QR code to connect')
          console.log(`Or copy the url directly: ${uri}`)
        })
        .catch(console.error)
    },
  }

  const walletConnect = new WalletConnect(
    {
      projectId: PROJECT_ID,
      relayUrl: 'wss://relay.walletconnect.com',
    },
    wxUxHandler
  )

  await walletConnect.connect()

  await keyManager.addKeysProvider('WalletConnect', walletConnect)

  const { keys } = keyManager
  console.log('Available keys:', keys)

  if (!keys.length) {
    throw new Error('No keys available')
  }

  const selectedAccount = await select({
    message: 'Choose account to sign a proof message with:',
    choices: keys.map((a) => ({
      name: `${a.address} (${a.provider})`,
      value: a.address,
    })),
  })

  const message = await input({
    message: 'Provide a message to sign:',
  })

  console.log('Waiting for signature...')
  const signature = await keyManager.signMessage(message, selectedAccount)

  console.log(`Signature: ${signature}`)
  const result = signatureVerify(message, signature, selectedAccount)

  console.log(`Signature ${result.isValid ? `is valid` : `is not valid`}`)
}

main().catch(console.error)
