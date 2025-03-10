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

export type Config = {
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

type DefaultSelectionOf<E extends AnyEntity> =
  E extends keyof typeof DEFAULT_SELECTION
    ? (typeof DEFAULT_SELECTION)[E]
    : { __scalar: true }

type Fallback<T1, T2> = undefined extends T1 ? T2 : T1

type WhereOf<Q extends keyof QueryGenqlSelection> =
  NonNullable<ArgsOf<Q>> extends { where?: infer W | null } ? W : never

type OrderByOf<Q extends keyof QueryGenqlSelection> =
  NonNullable<ArgsOf<Q>> extends { orderBy?: infer O | null } ? O : never

type CommonArgs<Q extends keyof QueryGenqlSelection> = {
  where?: WhereOf<Q>
  orderBy?: OrderByOf<Q>
}

type ResultOf<Q extends keyof QueryGenqlSelection, S> = QueryResult<{
  [K in Q]: S
}>

type Extracted<T> = Exclude<T[keyof T & string], null>

type ExtractedResult<Q extends keyof QueryGenqlSelection, S> = Extracted<
  ResultOf<Q, S>
>

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
  S extends SelectionOf<MultiQueryOf<E>>,
> =
  ExtractedResult<
    ConnectionQueryOf<E>,
    PaginationQuerySelection<S>
  > extends PaginationResult<infer N>
    ? PaginationResult<N>
    : never

type NodeTypeOf<R extends PaginationResult<unknown>> =
  R['edges'][number]['node']

abstract class Pagination<N> {
  protected abstract _hasNextPage: boolean
  abstract nextPage(): Promise<N[]>

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

  async fetchAll(): Promise<N[]> {
    return this.fetch(Infinity)
  }

  public get hasNextPage() {
    return this._hasNextPage
  }
}

class OffsetPagination<N> extends Pagination<N> {
  private _offset: number | undefined = undefined
  protected _hasNextPage: boolean = true

  constructor(
    private fetchPage: (
      limit: number,
      offset: number | undefined
    ) => Promise<N[]>,
    private _pageSize: number
  ) {
    super()
  }

  async nextPage(): Promise<N[]> {
    if (!this._hasNextPage) {
      return []
    }
    // Here we use a little trick to set the value of _hasNextPage:
    // we set the limit to `this._pageSize + 1` and then drop the extra entity
    // if needed
    const result = await this.fetchPage(this._pageSize + 1, this._offset)
    this._offset = (this._offset || 0) + Math.min(result.length, this._pageSize)
    this._hasNextPage = result.length > this._pageSize

    return result.slice(0, this._pageSize)
  }

  public get offset() {
    return this._offset
  }
}

class ConnectionPagination<N> extends Pagination<N> {
  private _cursor: string | null | undefined = undefined
  protected _hasNextPage: boolean = true

  constructor(
    private fetchPage: (
      cursor: string | null | undefined
    ) => Promise<PaginationResult<N>>
  ) {
    super()
  }

  async nextPage(): Promise<N[]> {
    if (!this._hasNextPage) {
      return []
    }
    const result = await this.fetchPage(this._cursor)
    this._cursor = result.pageInfo.endCursor
    this._hasNextPage = result.pageInfo.hasNextPage

    return result.edges.map((e) => e.node)
  }

  public get cursor() {
    return this._cursor
  }
}

type PaginationQuerySelection<S> = {
  edges: { node: S }
  pageInfo: { hasNextPage: true; endCursor: true }
}

export enum PaginationType {
  Offset,
  Connection,
}

type PaginationFor<
  P extends PaginationType,
  E extends AnyEntity,
  S extends SelectionOf<MultiQueryOf<E>>,
> = P extends PaginationType.Connection
  ? ConnectionPagination<NodeTypeOf<PaginationResultOf<E, S>>>
  : OffsetPagination<ExtractedResult<UniqueQueryOf<E>, S>>

class EntityQueryUtils<E extends AnyEntity, P extends PaginationType> {
  private defaultSelection: DefaultSelectionOf<E>

  constructor(
    private runQuery: <Q extends QueryGenqlSelection>(
      query: Q
    ) => Promise<FieldsSelection<Query, Q>>,
    private config: Config,
    private entity: E,
    private paginationType: P
  ) {
    this.defaultSelection = (
      entity in DEFAULT_SELECTION
        ? DEFAULT_SELECTION[entity as keyof typeof DEFAULT_SELECTION]
        : { __scalar: true }
    ) as DefaultSelectionOf<E>
  }

  private offsetPagination<
    A extends CommonArgs<MultiQueryOf<E>>,
    S extends SelectionOf<MultiQueryOf<E>>,
  >(args: { select?: S; pageSize?: number } & A) {
    const multiQuery = ENTITY_INFO[this.entity]['multiQuery']
    const pageSize = args.pageSize || this.config.resultsPerQueryLimit
    const fetchPage = async (limit: number, offset: number | undefined) => {
      const querySelection = args.select || this.defaultSelection
      const queryArgs = {
        where: args.where,
        orderBy: args.orderBy,
        limit,
        offset,
      }
      const query = {
        [multiQuery]: { __args: queryArgs, ...querySelection },
      } as {
        [K in MultiQueryOf<E>]: { __args: typeof queryArgs } & Fallback<
          S,
          DefaultSelectionOf<E>
        >
      }
      const page = await this.runQuery(query)
      if (page && multiQuery in page && page[multiQuery as keyof typeof page]) {
        return page[multiQuery as keyof typeof page] as ExtractedResult<
          UniqueQueryOf<E>,
          S
        >[]
      }
      throw new UnexpectedEmptyResult(multiQuery, page)
    }

    return new OffsetPagination<ExtractedResult<UniqueQueryOf<E>, S>>(
      fetchPage,
      pageSize
    )
  }

  private connectionPagination<
    A extends CommonArgs<MultiQueryOf<E>>,
    S extends SelectionOf<MultiQueryOf<E>>,
  >(args: { select?: S; pageSize?: number } & A) {
    const connectionQuery = ENTITY_INFO[this.entity]['connectionQuery']
    const fetchPage = async (
      cursor: string | null | undefined
    ): Promise<PaginationResultOf<E, S>> => {
      const querySelection: PaginationQuerySelection<S> = {
        edges: {
          node: {
            ...((args.select || this.defaultSelection) as S),
          },
        },
        pageInfo: {
          hasNextPage: true,
          endCursor: true,
        },
      }
      const queryArgs = {
        where: args.where,
        orderBy: args.orderBy,
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
        } & PaginationQuerySelection<S>
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

    return new ConnectionPagination<NodeTypeOf<PaginationResultOf<E, S>>>(
      fetchPage
    )
  }

  public paginate<
    A extends CommonArgs<MultiQueryOf<E>>,
    S extends SelectionOf<MultiQueryOf<E>>,
  >(args: { select: S; pageSize?: number } & A): PaginationFor<P, E, S>

  public paginate<A extends CommonArgs<MultiQueryOf<E>>>(
    args: { select: DefaultSelectionOf<E>; pageSize?: number } & A
  ): PaginationFor<P, E, DefaultSelectionOf<E>>

  public paginate<
    A extends CommonArgs<MultiQueryOf<E>>,
    S extends SelectionOf<MultiQueryOf<E>> = DefaultSelectionOf<E>,
  >(args: { select?: S; pageSize?: number } & A): PaginationFor<P, E, S> {
    if (this.paginationType === PaginationType.Connection) {
      return this.connectionPagination<A, S>(args) as PaginationFor<P, E, S>
    } else {
      return this.offsetPagination<A, S>(args) as PaginationFor<P, E, S>
    }
  }

  async byMany<W extends WhereOf<MultiQueryOf<E>>, I>(args: {
    where: (input: I[]) => W
    input: I[]
  }): Promise<ExtractedResult<MultiQueryOf<E>, DefaultSelectionOf<E>>>

  async byMany<
    W extends WhereOf<MultiQueryOf<E>>,
    I,
    S extends SelectionOf<MultiQueryOf<E>>,
  >(args: {
    where: (input: I[]) => W
    input: I[]
    select: S
  }): Promise<ExtractedResult<MultiQueryOf<E>, S>>

  async byMany<W extends WhereOf<MultiQueryOf<E>>, I, S>(args: {
    where: (input: I[]) => W
    input: I[]
    select?: S
  }): Promise<ExtractedResult<MultiQueryOf<E>, S>> {
    const multiQuery = ENTITY_INFO[this.entity]['multiQuery']
    const results = await Promise.all(
      _.chunk(args.input, this.config.inputBatchSize).map(
        async (inputChunk) => {
          const query = {
            [multiQuery]: {
              __args: { where: args.where(inputChunk) },
              ...(args.select || this.defaultSelection),
            },
          } as {
            [K in MultiQueryOf<E>]: { __args: { where: W } } & Fallback<
              S,
              DefaultSelectionOf<E>
            >
          }
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

    return results.flat() as ExtractedResult<MultiQueryOf<E>, S>
  }

  async byId(
    id: string
  ): Promise<ExtractedResult<UniqueQueryOf<E>, DefaultSelectionOf<E>>>

  async byId<S extends SelectionOf<UniqueQueryOf<E>>>(
    id: string,
    select: S
  ): Promise<ExtractedResult<UniqueQueryOf<E>, S>>

  async byId<S>(
    id: string,
    select?: S
  ): Promise<ExtractedResult<UniqueQueryOf<E>, S>> {
    const uniqueQuery = ENTITY_INFO[this.entity]['uniqueQuery']
    const query = {
      [uniqueQuery]: {
        __args: {
          where: { id },
        },
        ...(select || this.defaultSelection),
      },
    } as {
      [K in UniqueQueryOf<E>]: { __args: { where: { id: string } } } & Fallback<
        S,
        DefaultSelectionOf<E>
      >
    }
    const result = await this.runQuery(query)

    if (uniqueQuery in result && result[uniqueQuery as keyof typeof result]) {
      const extracted = result[uniqueQuery as keyof typeof result]
      if (extracted) {
        return extracted as ExtractedResult<UniqueQueryOf<E>, S>
      }
    }

    throw new EntityNotFoundError(this.entity, id)
  }

  async byIds<S extends SelectionOf<MultiQueryOf<E>>>(
    ids: string[],
    select: S
  ): Promise<ExtractedResult<MultiQueryOf<E>, S>>

  async byIds(
    ids: string[]
  ): Promise<ExtractedResult<MultiQueryOf<E>, DefaultSelectionOf<E>>>

  async byIds<S>(
    ids: string[],
    select?: S
  ): Promise<ExtractedResult<MultiQueryOf<E>, S>> {
    return this.byMany({
      select: select || this.defaultSelection,
      where: (ids) => ({ id_in: ids }) as WhereOf<MultiQueryOf<E>>,
      input: ids,
    }) as ExtractedResult<MultiQueryOf<E>, S>
  }
}

type AllEntitiesQueryUtils<P extends PaginationType> = {
  [K in AnyEntity]: EntityQueryUtils<K, P>
}

export class QueryApi<P extends PaginationType = PaginationType.Connection> {
  private _config: Config
  private _requestsQueue: Queue
  private _client: Client
  private _debug: Debugger
  public query: AllEntitiesQueryUtils<P>

  public constructor(
    private url: string,
    private paginationType: P,
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
        new EntityQueryUtils<AnyEntity, P>(
          this.runQuery.bind(this),
          this._config,
          e as AnyEntity,
          this.paginationType
        ),
      ])
    ) as AllEntitiesQueryUtils<P>
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
