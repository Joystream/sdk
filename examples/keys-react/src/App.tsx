import { Homepage } from './Homepage'
import { KeyManagerProvider } from './providers/keys'

function App() {
  return (
    <KeyManagerProvider>
      <Homepage />
    </KeyManagerProvider>
  )
}

export default App
