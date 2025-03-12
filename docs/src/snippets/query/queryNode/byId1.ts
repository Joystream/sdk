import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  // Get all scalar fields of member by id=336
  const member = await qnApi.query.Membership.byId('336')
  log(member)
  // @snippet-end
}
