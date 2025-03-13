import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  const result = await qnApi.client.query({
    postsByText: {
      __args: {
        text: 'Joystream',
        limit: 10,
      },
      item: {
        __typename: true,
        on_ForumPost: {
          id: true,
          text: true,
        },
      },
    },
  })
  log(result)
  // @snippet-end
}
