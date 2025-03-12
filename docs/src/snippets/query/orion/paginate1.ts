import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Get ids and titles of ALL channels,
  // fetching no more than 1000 channels in a single query
  const channels = await orionApi.query.Channel.paginate({
    orderBy: ['createdAt_ASC'],
    select: { id: true, title: true },
    pageSize: 1000,
  }).fetchAll()
  log(channels)
  // @snippet-end
}
