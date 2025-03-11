import _ from 'lodash'
import assert from 'node:assert'
import fs from 'fs/promises'

export type GenQLTypes = {
  types: Record<string, unknown> & {
    Query: Record<string, unknown>
  }
}

export type EntityInfo = {
  [entityName: string]: {
    uniqueQuery: string
    connectionQuery: string
    multiQuery: string
  }
}

export async function generateEntityInfo(
  genQLTypes: GenQLTypes,
  outputPath: string
) {
  const TYPES = genQLTypes['types']
  const QUERIES = genQLTypes['types']['Query']

  const byUniqueInputQueries = Object.keys(QUERIES).filter((k) =>
    k.endsWith('ByUniqueInput')
  )

  const entityInfo: EntityInfo = {}

  for (const uniqueQuery of byUniqueInputQueries) {
    const baseName = uniqueQuery.replace('ByUniqueInput', '')
    const connectionQuery = _.find(Object.keys(QUERIES), (k) =>
      baseName.endsWith('y')
        ? !!k.match(new RegExp(`^${baseName.slice(0, -1)}iesConnection$`))
        : !!k.match(new RegExp(`^${baseName}(s|es)*Connection$`))
    )
    assert(connectionQuery, `Connection query not found for: ${baseName}`)
    const multiQuery = connectionQuery.replace('Connection', '')

    const entityName = _.upperFirst(baseName)
    assert(entityName in TYPES, `${entityName} not found in types`)
    assert(
      `${entityName}WhereInput` in TYPES,
      `${entityName}WhereInput not found`
    )
    assert(multiQuery in QUERIES, `${multiQuery} not found in queries`)

    entityInfo[entityName] = {
      uniqueQuery,
      connectionQuery,
      multiQuery,
    }
  }

  await fs.writeFile(
    outputPath,
    `export const ENTITY_INFO = ${JSON.stringify(entityInfo, null, 2)} as const`
  )
}
