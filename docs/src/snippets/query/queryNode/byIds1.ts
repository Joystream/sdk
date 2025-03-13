import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  // Get all scalar fields of a few different members:
  const members = await qnApi.query.Membership.byIds(['4129', '3234', '957'])
  log(members)
  // @snippet-end
}
