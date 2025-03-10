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
import { DEFAULT_SELECTION } from '../defaultSelection'
import {
  EntityNotFoundError,
  UnexpectedEmptyResult,
} from '@joystream/sdk-core/query/errors'
import { rootDebug } from '@joystream/sdk-core/utils/debug'
import { ClientOptions } from './genql/runtime'

type Config = {
  // Maximum size of an array of input arguments to a query (for example, list of ids in `query.Entity.byIds`)
  inputBatchSize: number
  // Maximum number of results to fetch in a single query
  resultsPerQueryLimit: number
  // Maximum number of requests that can be sent concurrently to GraphQL server
  concurrentRequestsLimit: number
  // GenQL client options
  clientOptions?: ClientOptions
}

export const DEFAULT_CONFIG: Config = {
  inputBatchSize: 1000,
  resultsPerQueryLimit: 1000,
  concurrentRequestsLimit: 20,
}

type AsExtending<T1, T2> = T1 extends T2 ? T1 : never

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

type DefaultSelectionOf<
  E extends AnyEntity,
  Q extends keyof QueryGenqlSelection = UniqueQueryOf<E>,
> = E extends keyof typeof DEFAULT_SELECTION
  ? AsExtending<(typeof DEFAULT_SELECTION)[E], SelectionOf<Q>>
  : AsExtending<{ __scalar: true }, SelectionOf<Q>>

type WhereOf<Q extends keyof QueryGenqlSelection> =
  NonNullable<ArgsOf<Q>> extends { where?: infer W | null } ? W : never

type OrderByOf<Q extends keyof QueryGenqlSelection> =
  NonNullable<ArgsOf<Q>> extends { orderBy?: infer O | null } ? O : never

type CommonArgs<Q extends keyof QueryGenqlSelection> = {
  where?: WhereOf<Q>
  orderBy?: OrderByOf<Q>
}

type ResultOf<
  E extends AnyEntity,
  Q extends keyof QueryGenqlSelection,
  S,
> = QueryResult<{
  [K in Q]: undefined extends S ? DefaultSelectionOf<E> : S
}>

type Extracted<T> = Exclude<T[keyof T & string], null>

type ExtractedResult<
  E extends AnyEntity,
  Q extends keyof QueryGenqlSelection,
  S,
> = Extracted<ResultOf<E, Q, S>>

type EntityInfo = typeof ENTITY_INFO
export type AnyEntity = keyof EntityInfo
type UniqueQueryOf<E extends AnyEntity> = EntityInfo[E]['uniqueQuery']
type MultiQueryOf<E extends AnyEntity> = EntityInfo[E]['multiQuery']
type ConnectionQueryOf<E extends AnyEntity> = EntityInfo[E]['connectionQuery']

type PaginationResult<N> = {
  edges: {
    node: N
  }[]
  pageInfo: {
    hasNextPage: boolean
    endCursor: string | null
  }
}

type PaginationResultOf<
  E extends AnyEntity,
  S extends SelectionOf<MultiQueryOf<E>> | undefined,
> =
  ExtractedResult<
    E,
    ConnectionQueryOf<E>,
    PaginationQuerySelection<E, S>
  > extends PaginationResult<infer N>
    ? PaginationResult<N>
    : never

type NodeTypeOf<R extends PaginationResult<unknown>> =
  R['edges'][number]['node']

class Pagination<N> {
  private _cursor: string | null | undefined = undefined
  private _hasNextPage: boolean = true

  constructor(
    private fetchPage: (
      cursor: string | null | undefined
    ) => Promise<PaginationResult<N>>
  ) {}

  async nextPage(): Promise<N[]> {
    if (!this._hasNextPage) {
      return []
    }
    const result = await this.fetchPage(this._cursor)
    this._cursor = result.pageInfo.endCursor
    this._hasNextPage = result.pageInfo.hasNextPage

    return result.edges.map((e) => e.node)
  }

  async fetchAll(): Promise<N[]> {
    return this.fetch(Infinity)
  }

  async fetch(limit: number): Promise<N[]> {
    let results: N[] = []
    while (this._hasNextPage && results.length < limit) {
      const pageResults = await this.nextPage()
      if (pageResults) {
        results = results.concat(pageResults)
      }
    }

    return results.slice(0, limit)
  }

  public get hasNextPage() {
    return this._hasNextPage
  }

  public get cursor() {
    return this._cursor
  }
}

type PaginationQuerySelection<E extends AnyEntity, S> = {
  edges: { node: undefined extends S ? DefaultSelectionOf<E> : S }
  pageInfo: { hasNextPage: true; endCursor: true }
}

class EntityQueryUtils<E extends AnyEntity> {
  private defaultSelection: DefaultSelectionOf<E>

  constructor(
    private runQuery: <Q extends QueryGenqlSelection>(
      query: Q
    ) => Promise<FieldsSelection<Query, Q>>,
    private config: Config,
    private entity: E
  ) {
    this.defaultSelection = (
      entity in DEFAULT_SELECTION
        ? DEFAULT_SELECTION[entity as keyof typeof DEFAULT_SELECTION]
        : { __scalar: true }
    ) as DefaultSelectionOf<E>
  }

  public paginate<
    A extends CommonArgs<MultiQueryOf<E>>,
    S extends SelectionOf<MultiQueryOf<E>> | undefined,
  >(args: { select?: S; pageSize?: number } & A) {
    const connectionQuery = ENTITY_INFO[this.entity]['connectionQuery']
    const fetchPage = async (
      cursor: string | null | undefined
    ): Promise<PaginationResultOf<E, S>> => {
      const querySelection: PaginationQuerySelection<E, S> = {
        edges: {
          node: {
            ...((args.select || this.defaultSelection) as undefined extends S
              ? DefaultSelectionOf<E>
              : S),
          },
        },
        pageInfo: {
          hasNextPage: true,
          endCursor: true,
        },
      }
      const queryArgs = {
        ...{ where: args.where, orderBy: args.orderBy },
        first: args.pageSize || this.config.resultsPerQueryLimit,
        after: cursor,
      }
      const query = {
        [connectionQuery]: {
          __args: queryArgs,
          ...querySelection,
        },
      } as {
        [K in ConnectionQueryOf<E>]: {
          __args: typeof queryArgs
        } & PaginationQuerySelection<E, S>
      }
      const page = await this.runQuery(query)
      if (
        page &&
        connectionQuery in page &&
        page[connectionQuery as keyof typeof page]
      ) {
        return page[connectionQuery as keyof typeof page] as PaginationResultOf<
          E,
          S
        >
      }
      throw new UnexpectedEmptyResult(connectionQuery, page)
    }

    return new Pagination<NodeTypeOf<PaginationResultOf<E, S>>>(fetchPage)
  }

  async byMany<
    W extends WhereOf<MultiQueryOf<E>>,
    I,
    S extends SelectionOf<MultiQueryOf<E>> | undefined,
  >(args: {
    where: (input: I[]) => W
    input: I[]
    select?: S
  }): Promise<ExtractedResult<E, MultiQueryOf<E>, S>> {
    const multiQuery = ENTITY_INFO[this.entity]['multiQuery']
    const results = await Promise.all(
      _.chunk(args.input, this.config.inputBatchSize).map(
        async (inputChunk) => {
          const query = {
            [multiQuery]: {
              __args: { where: args.where(inputChunk) },
              ...(args.select || this.defaultSelection),
            },
          } as { [K in MultiQueryOf<E>]: { __args: { where: W } } & S }
          const result = await this.runQuery(query)

          if (
            multiQuery in result &&
            result[multiQuery as keyof typeof result]
          ) {
            const extracted = result[multiQuery as keyof typeof result]
            if (extracted) {
              return extracted
            }
          }
          throw new UnexpectedEmptyResult(multiQuery)
        }
      )
    )

    return results.flat() as ExtractedResult<E, MultiQueryOf<E>, S>
  }

  async byId<S extends SelectionOf<UniqueQueryOf<E>> | undefined>(
    id: string,
    select?: S
  ): Promise<ExtractedResult<E, UniqueQueryOf<E>, S>> {
    const uniqueQuery = ENTITY_INFO[this.entity]['uniqueQuery']
    const query = {
      [uniqueQuery]: {
        __args: {
          where: { id },
        },
        ...(select || this.defaultSelection),
      },
    } as { [K in UniqueQueryOf<E>]: { __args: { where: { id: string } } } & S }
    const result = await this.runQuery(query)

    if (uniqueQuery in result && result[uniqueQuery as keyof typeof result]) {
      const extracted = result[uniqueQuery as keyof typeof result]
      if (extracted) {
        return extracted as ExtractedResult<E, UniqueQueryOf<E>, S>
      }
    }

    throw new EntityNotFoundError(this.entity, id)
  }

  async byIds<S extends SelectionOf<MultiQueryOf<E>> | undefined>(
    ids: string[],
    select?: S
  ): Promise<ExtractedResult<E, MultiQueryOf<E>, S>> {
    return this.byMany({
      select,
      where: (ids) => ({ id_in: ids }) as WhereOf<MultiQueryOf<E>>,
      input: ids,
    })
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
