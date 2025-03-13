---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
import { consts } from '@site/src/utils'

# Getting started

## What you'll need

- [Node.js](https://nodejs.org/en/download/) (recommended version 20.0 or above)

## Setup your project

<Tabs>
  <TabItem value="yarn" label="yarn" default>
  <CodeBlock language="bash">
    yarn init
    yarn add @joystream/sdk-core@{consts.gh.rawLinkBaseUrl}/packages/core/package.tgz?t=$(date +%s)
  </CodeBlock>
  If working with TypeScript (recommended):
  <CodeBlock language="bash"> 
    yarn add --dev typescript
    yarn add --dev tsx
  </CodeBlock>
  </TabItem>
  <TabItem value="npm" label="npm">
  <CodeBlock language="bash">
    npm init
    npm install --save @joystream/sdk-core@{consts.gh.rawLinkBaseUrl}/packages/core/package.tgz?t=$(date +%s)
  </CodeBlock>
  If working with TypeScript:
  <CodeBlock language="bash"> 
    npm install --save-dev typescript
    npm install --save-dev tsx
  </CodeBlock>
  </TabItem>
</Tabs>
