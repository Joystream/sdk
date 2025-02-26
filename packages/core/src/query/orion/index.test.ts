import _ from 'lodash'
import { describe, expect, test } from '@jest/globals'
import { AnyEntity, OrionApi, VISIBLE_ENTITIES } from '.'
import { EntityNotFoundError } from '../errors'

const TEST_ORION_ENDPOINT: string = 'http://localhost:50002/graphql'

type IsAny<T> = 0 extends 1 & T ? true : false
type TypesMatch<A, B> = false extends IsAny<A> & IsAny<B>
  ? A extends B
    ? B extends A
      ? true
      : false
    : false
  : false

const expectTypeCheck = <Expected>() => {
  return {
    ofVariable: <Actual>(v: Actual) => {
      return {
        toPass: () => v
      } as TypesMatch<Expected, Actual> extends true ? { toPass: () => Actual } : never
    }
  }
}

describe('OrionApi', () => {
  const orionApi = new OrionApi(TEST_ORION_ENDPOINT)
  describe('byId', () => {
    describe('EntityNotFound case', () => {
      for (const entityName of VISIBLE_ENTITIES) {
        test(`${entityName}`, async () => {
          await expect(() =>
            orionApi.query[entityName as 'Membership'].byId('non_existing_id')
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
              : orionApi.query[entityName as 'Membership'].byId('1')

          const result = await query
          expect(result?.id).toBe('1')
        })
      }
    })
  })
  // TODO: byMany, byIds
  describe('Scalar fields typing', () => {
    test('BigInt', async () => {
      const { dataObjectsSizeLimit } =
        await orionApi.query.StorageBucket.byId('1')
      expectTypeCheck<string>().ofVariable(dataObjectsSizeLimit).toPass()
      expect(typeof dataObjectsSizeLimit).toBe('string')
    })
    test('DateTime', async () => {
      const { createdAt } = await orionApi.query.Channel.byId('1')
      expectTypeCheck<string>().ofVariable(createdAt).toPass()
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
  describe('Pagination', () => {
    describe('nextPage', () => {
      test('App', async () => {
        const PAGE_SIZE = 3
        const pagination = orionApi.query.App.paginate(
          {
            orderBy: ['id_DESC']
          },
          { id: true, name: true },
          PAGE_SIZE
        )
        const expectedData = _.sortBy(_.range(1, 11).map((i) => ({
          id: i.toString(),
          name: `App${i}`
        })), 'id').reverse()
        expect(pagination.hasNextPage).toEqual(true)
        const numPages = Math.ceil(expectedData.length / PAGE_SIZE)
        for (let i=0; i < numPages; ++i) {
          const pageData = await pagination.nextPage()
          expectTypeCheck<{ id: string, name: string }[]>().ofVariable(pageData).toPass()
          const expectedPageData = expectedData.slice(i * PAGE_SIZE, (i+1) * PAGE_SIZE)
          expect(pageData.length).toEqual(i !== numPages - 1 ? PAGE_SIZE : (expectedData.length % PAGE_SIZE) || PAGE_SIZE)
          expect(pageData).toEqual(expectedPageData)
          expect(pagination.hasNextPage).toEqual(i !== numPages - 1)
        }
      })
    })
    describe('fetchAll', () => {
      test('App', async () => {
        const PAGE_SIZE = 3
        const pagination = orionApi.query.App.paginate(
          {
            orderBy: ['id_DESC']
          },
          { id: true, name: true },
          PAGE_SIZE
        )
        expect(pagination.hasNextPage).toEqual(true)
        const results = await pagination.fetchAll()
        expect(pagination.hasNextPage).toEqual(false)
        expectTypeCheck<{ id: string, name: string }[]>().ofVariable(results).toPass()
        const expectedData = _.range(1, 11).map((i) => ({
          id: i.toString(),
          name: `App${i}`
        }))
        expect(results).toEqual(_.sortBy(expectedData, 'id').reverse())
      })
    })
  })
})
