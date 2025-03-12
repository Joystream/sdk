import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Get channel by id, along with those of its videos which are longer than 1 hour
  const channelWithVideos = await orionApi.query.Channel.byId('7692', {
    __scalar: true, // Get all scalar fields of Channel
    videos: {
      __args: { where: { duration_gt: 3600 } },
      __scalar: true, // Get all scalar fields of Video
    },
  })
  log(channelWithVideos)
  // @snippet-end
}
