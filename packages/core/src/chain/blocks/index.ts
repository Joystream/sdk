import { ApiPromise } from '@polkadot/api'
import { BlockHash, BlockNumber } from '@polkadot/types/interfaces'
import { u8aToHex, u8aToU8a } from '@polkadot/util'
import { BLOCK_TIME_MS } from '../consts'

type BlockInfo = {
  blockHash: `0x${string}`
  number: number
  parentHash?: `0x${string}`
  timestamp: number
}

export class BlockUtils {
  constructor(private api: ApiPromise) {}

  async timeAt(blockHash: BlockHash | `0x${string}`): Promise<number> {
    const apiAt = await this.api.at(blockHash)
    return (await apiAt.query.timestamp.now()).toNumber()
  }

  async numberOf(blockHash: BlockHash | `0x${string}`): Promise<number> {
    return (await this.api.rpc.chain.getHeader(blockHash)).number.toNumber()
  }

  inBlocks(ms: number, rate = BLOCK_TIME_MS): number {
    return Math.ceil(ms / rate)
  }

  async hashOf(
    numberOrHash: BlockHash | `0x${string}` | BlockNumber | number
  ): Promise<`0x${string}`> {
    if (
      typeof numberOrHash === 'string' ||
      numberOrHash instanceof Uint8Array
    ) {
      return u8aToHex(u8aToU8a(numberOrHash))
    }
    return (await this.api.rpc.chain.getBlockHash(numberOrHash)).toHex()
  }

  async blockInfo(
    numberOrHash: BlockHash | `0x${string}` | BlockNumber | number
  ): Promise<BlockInfo> {
    const blockHash = await this.hashOf(numberOrHash)
    const timestamp = await this.timeAt(blockHash)

    if (blockHash === this.api.genesisHash.toHex()) {
      return {
        blockHash,
        number: 0,
        timestamp,
      }
    }

    const header = await this.api.rpc.chain.getHeader(blockHash)

    return {
      blockHash,
      number: header.number.toNumber(),
      parentHash: u8aToHex(u8aToU8a(header.parentHash)),
      timestamp,
    }
  }

  async exactBlockAt(api: ApiPromise, date: Date): Promise<BlockInfo> {
    const targetTime = date.getTime()
    let candidateBlock = await this.blockInfo(
      await api.derive.chain.bestNumberFinalized()
    )

    if (candidateBlock.timestamp <= targetTime) {
      return candidateBlock
    }

    if (targetTime <= (await this.timeAt(api.genesisHash))) {
      return this.blockInfo(api.genesisHash)
    }

    let upperBoundry = candidateBlock.number - 1
    let lowerBoundry = 1

    const nextGuess = (previousGuess: number, currentGuess: number) => {
      if (previousGuess > currentGuess && previousGuess - 1 < upperBoundry) {
        upperBoundry = previousGuess - 1
      } else if (
        previousGuess < currentGuess &&
        previousGuess + 1 > lowerBoundry
      ) {
        lowerBoundry = previousGuess + 1
      }

      if (currentGuess < lowerBoundry) {
        return lowerBoundry
      }
      if (currentGuess > upperBoundry) {
        return upperBoundry
      }
      return currentGuess
    }

    while (true) {
      if (!candidateBlock.parentHash) {
        throw new Error(
          `Unexpected state: Block #${candidateBlock.number} has no parent hash.`
        )
      }
      const candidateParentTs = await this.timeAt(candidateBlock.parentHash)
      if (candidateParentTs > targetTime) {
        const overshotEstimation = this.inBlocks(
          candidateBlock.timestamp - targetTime
        )
        const newGuess = nextGuess(
          candidateBlock.number,
          candidateBlock.number - overshotEstimation
        )
        candidateBlock = await this.blockInfo(newGuess)
      }
      // candidateParentTs <= targetTime
      else if (candidateBlock.timestamp < targetTime) {
        const undershotEstimation = this.inBlocks(
          targetTime - candidateBlock.timestamp
        )
        const newGuess = nextGuess(
          candidateBlock.number,
          candidateBlock.number + undershotEstimation
        )
        candidateBlock = await this.blockInfo(newGuess)
      }
      // candidateParentTs <= targetTime
      // candidateBlock.timestamp >= targetTime
      else if (targetTime === candidateBlock.timestamp) {
        return candidateBlock
      }
      // candidateParentTs <= targetTime
      // candidateBlock.timestamp > targetTime
      else {
        return this.blockInfo(candidateBlock.parentHash)
      }
    }
  }
}
