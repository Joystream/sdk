import { ENTITY_INFO } from './__generated__/entityInfo'
import { QueryApi, AnyEntity } from './__generated__/QueryApi'

export const ALL_ENTITIES = Object.keys(ENTITY_INFO) as AnyEntity[]

export const StorageSquidApi = QueryApi
