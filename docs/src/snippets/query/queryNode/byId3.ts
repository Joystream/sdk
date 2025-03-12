import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  // Get election by id, along with candidating members and their vote power
  const election = await qnApi.query.ElectionRound.byId('00000014', {
    __scalar: true, // Retrieve all scalar fields of ElectionRound
    candidates: {
      member: { id: true, handle: true },
      votePower: true,
    },
  })
  log(election)
  // @snippet-end
}
