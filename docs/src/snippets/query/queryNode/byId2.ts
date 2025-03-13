import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  // Get proposal by id=9, along with some of its details
  const proposal = await qnApi.query.Proposal.byId('9', {
    __scalar: true, // Retrieve all scalar fields of Proposal
    details: {
      __typename: true,
      on_CreateWorkingGroupLeadOpeningProposalDetails: {
        group: {
          name: true,
        },
      },
      // ...handle other types if needed
    },
  })
  log(proposal)
  // @snippet-end
}
