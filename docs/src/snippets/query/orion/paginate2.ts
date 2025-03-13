import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  // Fetch data about creator tokens and log each page of 100 entries separately
  const crtPagination = orionApi.query.CreatorToken.paginate({
    orderBy: ['createdAt_ASC'],
    select: {
      id: true,
      symbol: true,
      lastPrice: true,
    },
    pageSize: 100,
  })
  let i = 1
  while (crtPagination.hasNextPage) {
    const page = await crtPagination.nextPage()
    log(`Page ${i}`)
    log(page)
    ++i
  }
  // @snippet-end
}
