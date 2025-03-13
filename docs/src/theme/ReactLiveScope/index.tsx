import React from 'react'
import { snippetScope } from '../../snippets/snippet'

// Add react-live imports you need here
const ReactLiveScope: unknown = {
  React,
  ...snippetScope,
  ...React,
}

export default ReactLiveScope
