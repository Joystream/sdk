import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Get specific fields of a few videos
  const videos = await orionApi.query.Video.byIds(['1', '5', '905'], {
    id: true,
    title: true,
    duration: true,
    category: {
      name: true,
    },
    channel: {
      title: true,
    },
  })
  log(videos)
  // @snippet-end
}
