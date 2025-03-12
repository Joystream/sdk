import React from 'react'
import { OrionApi } from '@joystream/sdk-core/query/orion'
import { QueryNodeApi } from '@joystream/sdk-core/query/queryNode'

// TODO: Replace with joystream.dev endpoints
const qnApi = new QueryNodeApi(`https://query.joystream.org/graphql`)
const orionApi = new OrionApi(`https://orion.gleev.xyz/graphql`)

// Add react-live imports you need here
const ReactLiveScope: unknown = {
  React,
  qnApi,
  orionApi,
  // storageSquidApi,
  ...React,
}

export default ReactLiveScope
