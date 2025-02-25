import { QueryNodeApi } from '@joystream/sdk-core/query/queryNode'

async function main() {
  const api = new QueryNodeApi('https://query.joystream.org/graphql')

  // Query members by their handles
  const handles = ['lezek', 'leet_joy', 'freakstatic', 'tomato']
  const members = await api.query.Membership.byMany(
    (handles) => ({ handle_in: handles }),
    handles
  )

  console.log(members)
}

main().catch(console.error)
