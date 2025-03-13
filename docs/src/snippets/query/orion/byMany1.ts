import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Get all scalar fields of a few channels by a list of title keywords
  const keywords = ['Bitcoin', 'Ethereum', 'Dogecoin']
  const channels = await orionApi.query.Channel.byMany({
    input: keywords,
    where: (keywords) => ({
      OR: keywords.map((k) => ({ title_containsInsensitive: k })),
    }),
  })
  log(channels)
  // @snippet-end
}
