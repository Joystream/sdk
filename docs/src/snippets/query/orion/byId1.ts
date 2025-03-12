import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Get all scalar fields of channel by id=1
  const channel = await orionApi.query.Channel.byId('1')
  log(channel)
  // @snippet-end
}
