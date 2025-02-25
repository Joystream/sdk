// @ts-nocheck {% CUT %}
// WARNING: THIS IS JUST A TEMPLATE FILE, IT SHOULD NOT BE USED DIRECTLY {% CUT %}
import { Debugger } from 'debug'
import _ from 'lodash'
import {
  createClient,
  QueryResult,
  Client,
  QueryGenqlSelection,
  generateQueryOp,
  Query,
  FieldsSelection,
} from './genql'
import Queue from 'queue'
import { ENTITY_INFO } from './entityInfo'
import {
  EntityNotFoundError,
  UnexpectedEmptyResult,
} from '@joystream/sdk-core/query/errors'
import { rootDebug } from '@joystream/sdk-core/utils/debug'
import { ClientOptions } from './genql/runtime'

type Config = {
  // Maximum size of an array of input arguments to a query (for example, list of ids in `query.Entity.byIds`)
  inputBatchSize: number
  // Maximum number of requests that can be sent concurrently to GraphQL server
  concurrentRequestsLimit: number
  // GenQL client options
  clientOptions?: ClientOptions
}

export const DEFAULT_CONFIG: Config = {
  inputBatchSize: 1000,
  concurrentRequestsLimit: 20,
}

type ArgsOf<Q extends keyof QueryGenqlSelection> =
  NonNullable<QueryGenqlSelection[Q]> extends {
    __args?: infer A
  }
    ? A
    : never

type SelectionOf<Q extends keyof QueryGenqlSelection> = Omit<
  NonNullable<QueryGenqlSelection[Q]>,
  '__args'
>

type WhereOf<Q extends keyof QueryGenqlSelection> =
  NonNullable<ArgsOf<Q>> extends { where?: infer W | null } ? W : never

type ResultOf<Q extends keyof QueryGenqlSelection, S> = QueryResult<{
  [K in Q]: S
}>

type Extracted<T> = Exclude<T[keyof T], null>

type ExtractedResult<
  Q extends keyof QueryGenqlSelection,
  S = { __scalar: true },
> = Extracted<ResultOf<Q, S>>

type EntityInfo = typeof ENTITY_INFO
export type AnyEntity = keyof EntityInfo
type UniqueQueryOf<E extends AnyEntity> = EntityInfo[E]['uniqueQuery']
type MultiQueryOf<E extends AnyEntity> = EntityInfo[E]['multiQuery']

class EntityQueryUtils<E extends AnyEntity> {
  constructor(
    private runQuery: <Q extends QueryGenqlSelection>(
      query: Q
    ) => Promise<FieldsSelection<Query, Q>>,
    private config: Config,
    private entity: E
  ) {}

  public async byMany<W extends WhereOf<MultiQueryOf<E>>, I>(
    whereGenerator: (input: I[]) => W,
    input: I[]
  ): Promise<ExtractedResult<MultiQueryOf<E>>>

  public async byMany<
    W extends WhereOf<MultiQueryOf<E>>,
    I,
    S extends SelectionOf<MultiQueryOf<E>>,
  >(
    whereGenerator: (input: I[]) => W,
    input: I[],
    select: S
  ): Promise<ExtractedResult<MultiQueryOf<E>, S>>

  async byMany<
    W extends WhereOf<MultiQueryOf<E>>,
    I,
    S extends SelectionOf<MultiQueryOf<E>>,
  >(
    whereGenerator: (input: I[]) => W,
    input: I[],
    select?: S
  ): Promise<ExtractedResult<MultiQueryOf<E>, S | { __scalar: true }>> {
    const multiQuery = ENTITY_INFO[this.entity]['multiQuery']
    const results = await Promise.all(
      _.chunk(input, this.config.inputBatchSize).map(async (inputChunk) => {
        const query = {
          [multiQuery]: {
            __args: { where: whereGenerator(inputChunk) },
            ...(select || { __scalar: true }),
          },
        } as { [K in MultiQueryOf<E>]: { __args: { where: W } } & S }
        const result = await this.runQuery(query)

        if (multiQuery in result && result[multiQuery as keyof typeof result]) {
          const extracted = result[multiQuery as keyof typeof result]
          if (extracted) {
            return extracted
          }
        }
        throw new UnexpectedEmptyResult(multiQuery)
      })
    )

    return results.flat() as ExtractedResult<
      MultiQueryOf<E>,
      S | { __scalar: true }
    >
  }

  async byId(id: string): Promise<ExtractedResult<UniqueQueryOf<E>>>

  async byId<S extends SelectionOf<UniqueQueryOf<E>>>(
    id: string,
    select: S
  ): Promise<ExtractedResult<UniqueQueryOf<E>, S>>

  async byId<S extends SelectionOf<UniqueQueryOf<E>>>(
    id: string,
    select?: S
  ): Promise<ExtractedResult<UniqueQueryOf<E>, S | { __scalar: true }>> {
    const uniqueQuery = ENTITY_INFO[this.entity]['uniqueQuery']
    const query = {
      [uniqueQuery]: {
        __args: {
          where: { id },
        },
        ...(select || { __scalar: true }),
      },
    } as { [K in UniqueQueryOf<E>]: { __args: { where: { id: string } } } & S }
    const result = await this.runQuery(query)

    if (uniqueQuery in result && result[uniqueQuery as keyof typeof result]) {
      const extracted = result[uniqueQuery as keyof typeof result]
      if (extracted) {
        return extracted as ExtractedResult<
          UniqueQueryOf<E>,
          S | { __scalar: true }
        >
      }
    }

    throw new EntityNotFoundError(this.entity, id)
  }
}

type AllEntitiesQueryUtils = {
  [K in AnyEntity]: EntityQueryUtils<K>
}

export class QueryApi {
  private _config: Config
  private _requestsQueue: Queue
  private _client: Client
  private _debug: Debugger
  public query: AllEntitiesQueryUtils

  public constructor(
    private url: string,
    config?: Partial<Config>
  ) {
    this._config = { ...DEFAULT_CONFIG, ...config }
    this._client = createClient({
      url: this.url,
      ...(this._config.clientOptions || {}),
    })
    this._debug = rootDebug.extend('query-api')
    this._requestsQueue = new Queue({
      autostart: true,
      concurrency: this._config.concurrentRequestsLimit,
    })
    this.query = Object.fromEntries(
      Object.keys(ENTITY_INFO).map((e) => [
        e,
        new EntityQueryUtils(
          this.runQuery.bind(this),
          this._config,
          e as AnyEntity
        ),
      ])
    ) as AllEntitiesQueryUtils
  }

  public runQuery<Q extends QueryGenqlSelection>(
    query: Q
  ): Promise<FieldsSelection<Query, Q>> {
    const debug = this._debug.extend('query')
    debug(generateQueryOp(query).query)

    return this.runWithReqLimit(() => this._client.query(query))
  }

  private async runWithReqLimit<T>(req: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      async function job() {
        try {
          const result = await req()
          resolve(result)
        } catch (e) {
          reject(e)
        }
      }
      this._requestsQueue.push(() => job())
    })
  }

  public get client(): Client {
    return this._client
  }

  public get requestsQueue(): Queue {
    return this._requestsQueue
  }
}
