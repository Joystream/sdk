import React, { type ReactNode } from 'react'
import useIsBrowser from '@docusaurus/useIsBrowser'
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import BrowserOnly from '@docusaurus/BrowserOnly'
import {
  ErrorBoundaryErrorMessageFallback,
  usePrismTheme,
} from '@docusaurus/theme-common'
import ErrorBoundary from '@docusaurus/ErrorBoundary'

import type { Props } from '@theme/Playground'
import type { ThemeConfig } from '@docusaurus/theme-live-codeblock'

import styles from './styles.module.css'

function LivePreviewLoader() {
  return <div>Loading...</div>
}

function Preview() {
  // No SSR for the live preview
  // See https://github.com/facebook/docusaurus/issues/5747
  return (
    <BrowserOnly fallback={<LivePreviewLoader />}>
      {() => (
        <>
          <ErrorBoundary
            fallback={(params) => (
              <ErrorBoundaryErrorMessageFallback {...params} />
            )}
          >
            <LivePreview />
          </ErrorBoundary>
          <LiveError />
        </>
      )}
    </BrowserOnly>
  )
}

function Result() {
  return (
    <div className={styles.playgroundPreview}>
      <Preview />
    </div>
  )
}

function ThemedLiveEditor() {
  const isBrowser = useIsBrowser()
  return (
    <LiveEditor
      // We force remount the editor on hydration,
      // otherwise dark prism theme is not applied
      key={String(isBrowser)}
      className={styles.playgroundEditor}
    />
  )
}

function Editor() {
  return <ThemedLiveEditor />
}

// this should rather be a stable function
// see https://github.com/facebook/docusaurus/issues/9630#issuecomment-1855682643
const DEFAULT_TRANSFORM_CODE = (code: string) => `
() => {
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const log = (value) => setLogs((l) => [...l, JSON.stringify(value, null, 2)])
  const runCode = async () => {
    setLogs([])
    setRunning(true)
    ${code}
    setRunning(false)
  }
  return (<>
    <div>
      <button
        disabled={running}
        className="button button--primary margin-right--xs"
        onClick={runCode}>
        { running ? 'Running...' : 'Run example' }
      </button>
      {!!logs.length && (
        <button
          className="button button--secondary"
          onClick={() => setLogs([])}>
          Clear output
        </button>
      )}
    </div>
    {!!logs.length && (<pre style={{ overflow: "hidden" }} class="margin-vert--md">
      <div style={{ maxHeight: 200, overflow: "auto", whiteSpace: "pre-wrap" }}>
        {logs.map((l) => <div>{l}</div>)}
      </div>
    </pre>) }
  </>)
}
`

function codePreTransform(code?: string) {
  if (
    !code ||
    !(code.includes('@snippet-begin') || code.includes('@snippet-end'))
  ) {
    return code
  }
  let start = false
  let whitespaceToRm = ''
  let transformed = ''
  for (const line of code.split('\n')) {
    if (line.includes('@snippet-end')) {
      break
    }
    if (start) {
      transformed += line.replace(new RegExp(`^${whitespaceToRm}`), '') + '\n'
    }
    if (line.includes('@snippet-begin')) {
      start = true
      whitespaceToRm = line.match(/^[\s]+/)[0]
    }
  }

  return transformed
}

export default function Playground({
  children,
  transformCode,
  ...props
}: Props): ReactNode {
  const {
    siteConfig: { themeConfig },
  } = useDocusaurusContext()
  const {
    liveCodeBlock: { playgroundPosition },
  } = themeConfig as ThemeConfig
  const prismTheme = usePrismTheme()

  const noInline = props.metastring?.includes('noInline') ?? false

  return (
    <div className={styles.playgroundContainer}>
      <LiveProvider
        code={codePreTransform(children).replace(/\n$/, '')}
        noInline={noInline}
        transformCode={transformCode ?? DEFAULT_TRANSFORM_CODE}
        theme={prismTheme}
        {...props}
      >
        {playgroundPosition === 'top' ? (
          <>
            <Result />
            <Editor />
          </>
        ) : (
          <>
            <Editor />
            <Result />
          </>
        )}
      </LiveProvider>
    </div>
  )
}
