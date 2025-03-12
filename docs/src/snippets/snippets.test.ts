import { describe } from '@jest/globals'
import { runSnippet, SnippetFunc } from './snippet'
import qnSnippets from './query/queryNode'
import orionSnippets from './query/orion'

const snippets = {
  query: {
    queryNode: qnSnippets,
    orion: orionSnippets,
  },
}

type Snippets = Record<string, SnippetFunc | Record<string, unknown>>

function testSnippets(source: Snippets) {
  for (const [name, value] of Object.entries(source)) {
    if (typeof value === 'function') {
      it(
        name,
        async () => {
          await runSnippet(value)
        },
        30_000
      )
    } else {
      describe(name, () => {
        testSnippets(value as Snippets)
      })
    }
  }
}

describe('Snippets', () => {
  testSnippets(snippets)
})
