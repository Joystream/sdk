import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  // Get ids and handles of ALL members,
  // fetching no more than 1000 members in a single query
  const members = await qnApi.query.Membership.paginate({
    orderBy: ['createdAt_ASC'],
    select: { id: true, handle: true },
    pageSize: 1000,
  }).fetchAll()
  log(members)
  // @snippet-end
}
