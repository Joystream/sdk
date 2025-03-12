import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  // Get specific fields of a few different members by their handles:
  const members = await qnApi.query.Membership.byMany({
    input: ['leet_joy', 'Jenny', 'Codefikeyz'],
    where: (handles) => ({ handle_in: handles }),
    select: {
      id: true,
      handle: true,
      metadata: {
        name: true,
        about: true,
      },
    },
  })
  log(members)
  // @snippet-end
}
