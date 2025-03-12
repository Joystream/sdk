import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  // Get all scalar fields of a few different members by their handles:
  const members = await qnApi.query.Membership.byMany({
    input: ['leet_joy', 'Jenny', 'Codefikeyz'],
    where: (handles) => ({ handle_in: handles }),
  })
  log(members)
  // @snippet-end
}
