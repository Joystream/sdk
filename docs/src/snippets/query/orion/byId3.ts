import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Get specific fields of a video by id=1
  const video = await orionApi.query.Video.byId('1', {
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
  log(video)
  // @snippet-end
}
