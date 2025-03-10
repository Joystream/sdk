import { AsCodec } from '@joystream/types'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { Codec, Observable } from '@polkadot/types/types'
import { AugmentedQuery } from '@polkadot/api/types'
import { u8aToBigInt } from '@polkadot/util'

export async function createApi(wsUri: string) {
  const wsProvider = new WsProvider(wsUri)
  const api = await ApiPromise.create({
    provider: wsProvider,
  })

  return api
}

export async function sortedEntries<
  IDType extends Codec,
  ValueType extends Codec,
>(
  apiMethod: AugmentedQuery<
    'promise',
    (key: IDType) => Observable<ValueType>,
    [IDType]
  >
): Promise<[IDType, AsCodec<ValueType>][]> {
  const entries: [IDType, AsCodec<ValueType>][] = (
    await apiMethod.entries()
  ).map(([storageKey, value]) => [storageKey.args[0] as IDType, value])

  return entries.sort((a, b) =>
    u8aToBigInt(a[0].toU8a()) < u8aToBigInt(b[0].toU8a()) ? -1 : 1
  )
}
