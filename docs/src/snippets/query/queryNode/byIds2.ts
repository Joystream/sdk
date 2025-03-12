import { SnippetParams } from '../../snippet'

export default async function ({ qnApi, log }: SnippetParams) {
  // @snippet-begin
  // Get a few proposals along with some of their details
  const proposals = await qnApi.query.Proposal.byIds(['9', '10', '11'], {
    __scalar: true,
    details: {
      on_CreateWorkingGroupLeadOpeningProposalDetails: {
        group: {
          name: true,
        },
      },
      // ...handle other types if needed
    },
  })
  log(proposals)
  // @snippet-end
}
