import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Query specific fields of videos by their ytVideoIds
  const videos = await orionApi.query.Video.byMany({
    input: ['GlIQQX5s2bw', 'rSiuFHKnhcA', 'WYb7884hM6o'],
    where: (ytVideoIds) => ({ ytVideoId_in: ytVideoIds }),
    select: {
      id: true,
      ytVideoId: true,
      title: true,
      description: true,
      channel: {
        id: true,
        title: true,
      },
    },
  })
  log(videos)
  // @snippet-end
}
