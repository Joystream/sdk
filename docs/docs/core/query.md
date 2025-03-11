---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Query module

The query module facilitates interactions with Joystream GraphQL APIs exposed by:

- [Query node](https://github.com/Joystream/joystream/tree/master/query-node)
- [Orion](https://github.com/Joystream/orion)
- [Storage squid service](https://github.com/Joystream/storage-squid)

It allows executing queries against those APIs in a fully **type-safe** way, without the need for any additional complex setup.

This is possible thanks to [GenQL](https://genql.dev/docs) which generates a base TypeScript GraphQL client based on the GraphQL schema.

## Create query API

<Tabs>
  <TabItem value="query-node" label="Query node" default>
  ```typescript
  import { QueryNodeApi } from "@joystream/sdk-core/query/queryNode";
  const qApi = new QueryNodeApi("https://query.joystream.org/graphql");
  ```
  </TabItem>
  <TabItem value="orion" label="Orion" default>
  ```typescript
  import { OrionApi } from "@joystream/sdk-core/query/orion";
  const qApi = new OrionApi("https://orion.gleev.xyz/graphql");
  ```
  </TabItem>
  <TabItem value="storage-squid" label="Storage squid" default>
  ```typescript
  import { StorageSquidApi } from '@joystream/sdk-core/query/storageSquid';
  const qApi = new StorageSquidApi("http://localhost:4352/graphql");
  ```
  </TabItem>
</Tabs>

## Configuration

All `QueryApi`s (ie. `QueryNodeApi`, `OrionApi`, `StorageSquidApi`), accept an optional configuration object
as a second argument to their constructors (after url):

```typescript
export type Config = {
  // Maximum size of an array of inputs to a single query
  // (for example, max. chunk size of ids in `query.ENTITY.byIds`)
  // Default: 1000
  inputBatchSize: number
  // Maximum number of results to fetch in a single query
  // Default: 1000
  resultsPerQueryLimit: number
  // Maximum number of requests that can be sent concurrently to GraphQL server
  // Default: 20
  concurrentRequestsLimit: number
  // Additional GenQL client options
  clientOptions?: ClientOptions
}
```

## Execute queries

### Get entity by id

Queries an entity by its ID.

#### Syntax

<pre>
qApi.query.**_ENTITY_NAME_**.byId(**_ID_**) // Selects all scalar fields
qApi.query.**_ENTITY_NAME_**.byId(**_ID_**, **_SELECTION_**) // Selects specified fields
</pre>

#### Examples

<Tabs>
  <TabItem value="query-node" label="Query node" default>

```typescript
// Get all scalar fields of member by id=336
const member = await qApi.query.Membership.byId('336')
```

```typescript
// Get proposal by id=9, along with some of its details
const proposal = await qApi.query.Proposal.byId('9', {
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
```

```typescript
// Get election by id, along with candidating members and their vote power
const election = await qApi.query.ElectionRound.byId('00000014', {
  __scalar: true, // Retrieve all scalar fields of ElectionRound
  candidates: {
    member: { id: true, handle: true },
    votePower: true,
  },
})
```

  </TabItem>
  <TabItem value="orion" label="Orion" default>

```typescript
// Get all scalar fields of channel by id=1
const channel = await qApi.query.Channel.byId('1')
```

```typescript
// Get channel by id, along with those of its videos which are longer than 1 minute
const channelWithVideos = await qApi.query.Channel.byId('1', {
  __scalar: true, // Get all scalar fields of Channel
  videos: {
    __args: { where: { duration_gt: 60 } },
    __scalar: true, // Get all scalar fields of Video
  },
})
```

```typescript
// Get specific fields of a video by id=1
const video = await qApi.query.Video.byId('1', {
  id: true,
  title: true,
  duration: true,
  category: {
    name: true,
  },
  channel: {
    title: true,
  },
})
```

  </TabItem>
  <TabItem value="storage-squid" label="Storage squid" default>

```typescript
// Get all scalar fields of storage bucket by id=0
const storageBucket = await qApi.query.StorageBucket.byId('0')
```

```typescript
// Get storage bag of channel 1, along with some information about its data objects
const storageBag = await qApi.query.StorageBag.byId('dynamic:channel:1', {
  __scalar: true,
  objects: {
    id: true,
    ipfsHash: true,
    size: true,
  },
})
```

  </TabItem>
</Tabs>

### Get multiple entities by ids

Retrieves multiple entities by their ids.

Will execute multiple queries in case the list of ids is very large to avoid hitting the 2 MB request size limit.

The exact number of entities retrieved in a single query can be controlled with [`config.inputBatchSize`](#configuration).

#### Syntax

<pre>
qApi.query.**_ENTITY_NAME_**.byIds(**_IDS_**) // Selects all scalar fields
qApi.query.**_ENTITY_NAME_**.byIds(**_IDS_**, **_SELECTION_**) // Selects specified fields
</pre>

<Tabs>
  <TabItem value="query-node" label="Query node" default>
    ```typescript
    // Get all scalar fields of a few different members:
    const members = await qApi.query.Memberships.byIds(['4129', '3234', '957'])
    ```

    ```typescript
    // Get a few proposals along with some of their details
    const proposals = await qApi.query.Proposal.byIds(['9', '10', '11'], {
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
    ```

  </TabItem>

  <TabItem value="orion" label="Orion" default>
    ```typescript
    // Get all scalar fields of a few channels
    const channels = await qApi.query.Channel.byIds(['1', '7692', '7698'])
    ```

    ```typescript
    // Query a few channels, along with those of their videos which are longer than 1 minute
    const channelWithVideos = await qApi.query.Channel.byIds(['1', '7692', '7698'], {
      __scalar: true,
      videos: {
        __args: { where: { duration_gt: 60 } },
        __scalar: true,
      },
    })
    ```

    ```typescript
    // Get specific fields of a few videos
    const video = await qApi.query.Video.byIds(['1', '5', '905'], {
      id: true,
      title: true,
      duration: true,
      category: {
        name: true,
      },
      channel: {
        title: true,
      },
    })
    ```

  </TabItem>

  <TabItem value="storage-squid" label="Storage squid" default>
    ```typescript
    // Get all scalar fields of a few storage buckets
    const storageBucket = await qApi.query.StorageBucket.byIds(['0', '1', '2'])
    ```

    ```typescript
    // Get storage bags of a few channels, along with some information about their data objects
    const storageBag = await qApi.query.StorageBag.byIds(
      [
        'dynamic:channel:1',
        'dynamic:channel:7692',
        'dynamic:channel:7698'
      ],
      {
        __scalar: true,
        objects: {
          id: true,
          ipfsHash: true,
          size: true,
        },
      }
    )
    ```

  </TabItem>
</Tabs>

### Get multiple entities from a list

Oftentimes you may have a list of values and would like to query some associated entities based on those values.

A specific example may be a list of ids, in which case you can use [`byIds`](#get-multiple-entities-by-ids) method.

But those values may not always ids, they can also be, for example:

- membership handles,
- ids of an associated entity (e.g. bag ids of storage data objects),

If the list you have is very large, you may want to make use of the features that [`byIds`](#get-multiple-entities-by-ids) method provides,
like auto-chunking and query parallelization.

Fortunately this is possible with `byMany` method.

#### Syntax

<pre>
qApi.query.**_ENTITY_NAME_**.byMany(\{
&nbsp;&nbsp;input: **_VALUES_**, // List of values to query from
&nbsp;&nbsp;where: **_WHERE_FUNCTION_**, // Takes a chunk of values and returns the <i>where</i> conditions
&nbsp;&nbsp;select: **_SELECTION_**, // Optional, by default all scalar fields are selected
\})
</pre>

#### Examples

<Tabs>
  <TabItem value="query-node" label="Query node" default>
    ```typescript
    // Get all scalar fields of a few different members by their handles:
    const members = await qApi.query.Memberships.byMany({
      input: ['leet_joy', 'Jenny', 'Codefikeyz'],
      where: (handles) => ({ handle_in: handles }),
    })
    ```

    ```typescript
    // Get specific fields of a few different members by their handles:
    const members = await qApi.query.Memberships.byMany({
      input: ['leet_joy', 'Jenny', 'Codefikeyz'],
      where: (handles) => ({ handle_in: handles }),
      select: {
        id: true,
        handle: true,
        metadata: {
          name: true,
          about: true,
        },
      },
    })
    ```

  </TabItem>

  <TabItem value="orion" label="Orion" default>
    ```typescript
    // Get all scalar fields of a few channels by a list of title keywords
    const keywords = ['Bitcoin', 'Ethereum', 'Dogecoin']
    const channels = await qApi.query.Channel.byMany(
      input: keywords,
      where: (keywords) => ({
        OR: keywords.map((k) => ({ title_containsInsensitive: k }))
      }),
    )
    ```

    ```typescript
    // Query specific fields of videos by their ytVideoIds
    const videos = await qApi.query.Video.byMany({
      input: ["GlIQQX5s2bw", "rSiuFHKnhcA", "WYb7884hM6o"],
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
    });
    ```

  </TabItem>

  <TabItem value="storage-squid" label="Storage squid" default>
    ```typescript
    // Query scalar fields of storage buckets by their node endpoints
    const endpoints = [
      "https://storage.js.8k.pm/storage/",
      "https://storage.freakstatic.com/storage/",
      "https://storage.0x2bc.com/storage/",
    ];
    const buckets = await qApi.query.StorageBucket.byMany({
      input: endpoints,
      where: (endpoints) => ({ operatorMetadata: { nodeEndpoint_in: endpoints } }),
    });
    ```

    ```typescript
    // Query ids and sizes of data objects by a list of bagIds
    const objects = await qApi.query.StorageDataObject.byMany({
      input: ["dynamic:channel:1", "dynamic:channel:7692", "dynamic:channel:7698"],
      where: (bagIds) => ({ storageBag: { id_in: bagIds } }),
      select: { id: true, size: true },
    });
    ```

  </TabItem>
</Tabs>

### Pagination

Pagination queries are useful for fetching larger quantities of data or loading more data on demand.

Joystream services use [Subsquid](https://docs.sqd.ai/) GraphQL servers which provide different kinds of pagination.

- **Relay-style pagination** using `Connection` queries (works in newer versions of Subsquid) is used by:
  - OrionApi
  - StorageSquidApi
- **Offset pagination** using `limit` and `offset` (works in older version of Subsquid) is used by:
  - QueryNodeApi

The query module of Joystream SDK provides a simple interface for running queries with pagination.

#### Syntax

<pre>
qApi.query.**_ENTITY_NAME_**.paginate(\{
&nbsp;&nbsp;select: **_SELECTION_**,
&nbsp;&nbsp;orderBy: **_ORDER_BY_LIST_**,
&nbsp;&nbsp;where: **_WHERE_ARGS_**,
&nbsp;&nbsp;pageSize: **_PAGE_SIZE_**, // Optional, [config.resultsPerQueryLimit](#configuration) will be used by default
\})
</pre>

The `paginate` method returns a `Pagination` object which matches the following interface:

```typescript
interface Pagination<Entity> {
  // True if next page is available, false otherwise.
  hasNextPage: boolean

  // Fetches next page of entities
  nextPage(): Promise<Entity[]>

  // Fetches all pages and combines them into a single result.
  // This may take a while and consume a lot of memory, so use with caution!
  fetchAll(): Promise<Entity[]>

  // Fetches a specific number of entities, running multiple queries if needed.
  fetch(items: number): Promise<Entity[]>
}
```

#### Examples

<Tabs>
  <TabItem value="query-node" label="Query node" default>
    ```typescript
    // Get ids and handles of ALL members,
    // fetching no more than 1000 members in a single query
    const members = await qApi.query.Membership.paginate({
      orderBy: ["createdAt_ASC"],
      select: { id: true, handle: true },
      pageSize: 1000,
    }).fetchAll();
    ```

    ```typescript
    // Fetch data about historical elections and save each page of 10 results to a separate file
    const electionPagination = qApi.query.ElectionRound.paginate({
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
      orderBy: ["createdAt_DESC"],
      pageSize: 10,
    });
    let i = 1;
    while (electionPagination.hasNextPage) {
      const page = await electionPagination.nextPage();
      fs.writeFileSync(`${i}.json`, JSON.stringify(page));
      ++i;
    }
    ```

  </TabItem>

  <TabItem value="orion" label="Orion" default>
    ```typescript
    // Get ids and titles of ALL channels,
    // fetching no more than 1000 channels in a single query
    const channels = await qApi.query.Channel.paginate({
      orderBy: ["createdAt_ASC"],
      select: { id: true, title: true },
      pageSize: 1000,
    }).fetchAll();
    ```

    ```typescript
    // Fetch data about creator tokens and save each page of 100 entries to a separate file
    const crtPagination = qApi.query.CreatorToken.paginate({
      orderBy: ["createdAt_ASC"],
      select: {
        id: true,
        symbol: true,
        lastPrice: true,
      },
      pageSize: 100,
    });
    let i = 1;
    while (crtPagination.hasNextPage) {
      const page = await crtPagination.nextPage();
      fs.writeFileSync(`${i}.json`, JSON.stringify(page));
      ++i;
    }
    ```

  </TabItem>

  <TabItem value="storage-squid" label="Storage squid" default>
    ```typescript
    // Get ids ALL storage bags,
    // fetching no more than 1000 bags in a single query
    const bags = await qApi.query.StorageBag.paginate({
      orderBy: ["createdAt_ASC"],
      select: { id: true },
      pageSize: 1000,
    }).fetchAll();
    ```

    ```typescript
    // Fetch information about the largest data objects
    // and save each page of 1000 entries to a separate file
    // (limit the number of files to 10)
    const objectsPagination = qApi.query.StorageDataObject.paginate({
      orderBy: ["size_DESC"],
      select: {
        id: true,
        size: true,
        type: {
          __typename: true,
        },
      },
      pageSize: 1000,
    });
    let i = 1;
    while (i <= 10 && objectsPagination.hasNextPage) {
      const page = await objectsPagination.nextPage();
      fs.writeFileSync(`${i}.json`, JSON.stringify(page));
      ++i;
    }
    ```

  </TabItem>
</Tabs>

### Custom queries

If you have more specific needs, you can access the underlying [GenQL](https://genql.dev/docs) client directly and take advantage of its type-safe interface to execute any GraphQL query you wish.

#### Examples

<Tabs>
  <TabItem value="query-node" label="Query node" default>
    ```typescript
    const result = await qApi.client.query({
      postsByText: {
        __args: {
          text: "Joystream",
          limit: 10,
        },
        item: {
          __typename: true,
          on_ForumPost: {
            id: true,
            text: true,
          },
        },
      },
    });
    ```
  </TabItem>

  <TabItem value="orion" label="Orion" default>
    ```typescript
    const result = await qApi.client.query({
      tokensWithPriceChange: {
        __args: {
          periodDays: 30,
          limit: 10,
          minVolume: "10000000000", // in HAPI
        },
        creatorToken: {
          id: true,
          symbol: true,
        },
        pricePercentageChange: true,
      },
    });
    ```
  </TabItem>

  <TabItem value="storage-squid" label="Storage squid" default>
    ```typescript
    const result = await qApi..client.query({
      squidStatus: {
        height: true,
      },
    });
    ```

  </TabItem>
</Tabs>

Read the [GenQL documentation](https://genql.dev/docs/usage) to find out more about how to use the GenQL client.
