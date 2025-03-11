---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting started

## What you'll need

- [Node.js](https://nodejs.org/en/download/) (recommended version 20.0 or above)

## Setup your project

<Tabs>
  <TabItem value="yarn" label="yarn" default>
  ```bash
    yarn init
    yarn add @joystream/sdk-core@https://github.com/Lezek123/sdk/raw/refs/heads/v1/packages/core/package.tgz?t=$(date +%s)
  ```
  If working with TypeScript:
  ```bash 
    yarn add --dev typescript
    yarn add --dev tsx
  ```
  </TabItem>
  <TabItem value="npm" label="npm">
  ```bash
    npm init
    npm install --save @joystream/sdk-core@https://github.com/Lezek123/sdk/raw/refs/heads/v1/packages/core/package.tgz?t=$(date +%s)
  ```
  If working with TypeScript:
  ```bash 
    npm install --save-dev typescript
    npm install --save-dev tsx
  ```
  </TabItem>
</Tabs>
