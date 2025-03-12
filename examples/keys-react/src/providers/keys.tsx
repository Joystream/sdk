import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { KeyManager } from '@joystream/sdk-core/keys'
import { Key } from '@joystream/sdk-core/keys/types'

export type KeyManagerContextValue = {
  keyManager?: KeyManager | null
}

export const KeyManagerContext = createContext<KeyManagerContextValue>({})

export const KeyManagerProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const keyManager = useRef<KeyManager | null>(null)
  if (!keyManager.current) {
    keyManager.current = new KeyManager()
  }

  return (
    <KeyManagerContext.Provider value={{ keyManager: keyManager.current }}>
      {children}
    </KeyManagerContext.Provider>
  )
}

export function useKeys(): { keys: Key[] } {
  const [keys, setKeys] = useState<Key[]>([])
  const { keyManager } = useContext(KeyManagerContext)
  useEffect(() => {
    if (keyManager) {
      return keyManager.subscribeKeys((k) => setKeys(k))
    }
  }, [keyManager])

  return { keys }
}
