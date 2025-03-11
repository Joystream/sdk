import { ENTITY_INFO } from './__generated__/entityInfo'
import {
  QueryApi,
  AnyEntity,
  PaginationType,
  Config,
} from './__generated__/QueryApi'

export const ALL_ENTITIES = Object.keys(ENTITY_INFO) as AnyEntity[]

export class StorageSquidApi extends QueryApi<PaginationType.Connection> {
  constructor(url: string, config?: Partial<Config>) {
    super(url, PaginationType.Connection, config)
  }
}
