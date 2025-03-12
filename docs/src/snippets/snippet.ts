import { OrionApi } from '@joystream/sdk-core/query/orion'
import { QueryNodeApi } from '@joystream/sdk-core/query/queryNode'

// TODO: Replace with joystream.dev endpoints
export const snippetScope = {
  qnApi: new QueryNodeApi(`https://query.joystream.org/graphql`),
  orionApi: new OrionApi(`https://orion.gleev.xyz/graphql`),
} as const

export type SnippetParams = {
  log: typeof console.log
} & typeof snippetScope

export type SnippetFunc = (params: SnippetParams) => Promise<void>

export const runSnippet = async (inner: SnippetFunc) => {
  await inner({
    log: console.log,
    ...snippetScope,
  })
}
