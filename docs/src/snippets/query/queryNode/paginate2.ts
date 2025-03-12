import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  // Fetch data about historical elections and log each page of 10 results separately
  const electionPagination = qnApi.query.ElectionRound.paginate({
    select: {
      id: true,
      isFinished: true,
      candidates: {
        member: {
          id: true,
          handle: true,
        },
        votePower: true,
      },
    },
    where: { isFinished_eq: true },
    orderBy: ['createdAt_DESC'],
    pageSize: 10,
  })
  let i = 1
  while (electionPagination.hasNextPage) {
    const page = await electionPagination.nextPage()
    log(`Page ${i}`)
    log(page)
    ++i
  }
  // @snippet-end
}
