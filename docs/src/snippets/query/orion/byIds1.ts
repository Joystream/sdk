import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Get all scalar fields of a few channels
  const channels = await orionApi.query.Channel.byIds(['1', '7692', '7698'])
  log(channels)
  // @snippet-end
}
