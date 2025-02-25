import { describe, expect, test } from '@jest/globals'
import { AnyEntity, OrionApi, VISIBLE_ENTITIES } from '.'
import { EntityNotFoundError } from '../errors'

const TEST_ORION_ENDPOINT: string = 'http://localhost:4350/graphql'

type PreventAny<T> = 0 extends 1 & T ? never : T
const expectTsType = <Expected>() => ({
  ofVariable: <Actual>(v: PreventAny<Actual> & Expected) => v as Expected,
})

describe('OrionApi', () => {
  const orionApi = new OrionApi(TEST_ORION_ENDPOINT)
  describe('byId', () => {
    describe('EntityNotFound case', () => {
      for (const entityName of VISIBLE_ENTITIES) {
        test(`${entityName}`, async () => {
          await expect(() =>
            orionApi.query[entityName as AnyEntity].byId('non_existing_id')
          ).rejects.toThrow(
            new EntityNotFoundError(entityName as AnyEntity, 'non_existing_id')
          )
        })
      }
    })
    describe('Standard case, default selection', () => {
      for (const entityName of VISIBLE_ENTITIES) {
        test(`${entityName}`, async () => {
          // FIXME: In case of `StorageDataObject` we omit `resolvedUrls`, because it's not really a scalar
          const query =
            entityName === 'StorageDataObject'
              ? orionApi.query.StorageDataObject.byId('1', {
                  __scalar: true,
                  resolvedUrls: false,
                })
              : orionApi.query[entityName as AnyEntity].byId('1')

          const result = await query
          expect(result?.id).toBe('1')
        })
      }
    })
  })

  describe('Scalar fields typing', () => {
    test('BigInt', async () => {
      const { dataObjectsSizeLimit } =
        await orionApi.query.StorageBucket.byId('1')
      expectTsType<string>().ofVariable(dataObjectsSizeLimit)
      expect(typeof dataObjectsSizeLimit).toBe('string')
    })
    test('DateTime', async () => {
      const { createdAt } = await orionApi.query.Channel.byId('1')
      expectTsType<string>().ofVariable(createdAt)
      expect(typeof createdAt).toBe('string')
      // Ensure the date can be parsed correctly
      const yearDiff = Math.abs(
        new Date(createdAt).getFullYear() - new Date().getFullYear()
      )
      expect(yearDiff).toBeLessThanOrEqual(1)
    })
  })
  describe('Concurrency', () => {
    test('limits', async () => {
      const limitedApi = new OrionApi(TEST_ORION_ENDPOINT, {
        concurrentRequestsLimit: 5,
      })

      const queriesToRun = 100
      let maxConcurrentRequests = 0
      let concurrentRequests = 0

      limitedApi.requestsQueue.addListener('start', () => {
        ++concurrentRequests
        if (concurrentRequests > maxConcurrentRequests) {
          maxConcurrentRequests = concurrentRequests
        }
      })
      limitedApi.requestsQueue.addListener('success', () => {
        --concurrentRequests
      })

      const queryResults = await Promise.all(
        Array.from({ length: queriesToRun }, () =>
          limitedApi.query.Membership.byId('1', { id: true })
        )
      )

      expect(maxConcurrentRequests).toEqual(5)
      expect(queryResults).toEqual(
        Array.from({ length: queriesToRun }, () => ({ id: '1' }))
      )
    })
  })
})
