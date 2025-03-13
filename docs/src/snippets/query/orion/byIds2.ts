import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Query a few channels, along with those of their videos which are longer than 1 hour
  const channelWithVideos = await orionApi.query.Channel.byIds(
    ['1', '7692', '7698'],
    {
      __scalar: true,
      videos: {
        __args: { where: { duration_gt: 3600 } },
        __scalar: true,
      },
    }
  )
  log(channelWithVideos)
  // @snippet-end
}
