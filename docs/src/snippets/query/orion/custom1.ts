import { SnippetParams } from '../../snippet'

export default async function ({ orionApi, log }: SnippetParams) {
  // @snippet-begin
  const result = await orionApi.client.query({
    tokensWithPriceChange: {
      __args: {
        periodDays: 30,
        limit: 10,
        minVolume: '10000000000', // in HAPI
      },
      creatorToken: {
        id: true,
        symbol: true,
      },
      pricePercentageChange: true,
    },
  })
  log(result)
  // @snippet-end
}
