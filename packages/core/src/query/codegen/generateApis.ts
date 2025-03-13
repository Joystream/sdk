import _ from 'lodash'
import fs from 'fs/promises'
import path from 'path'
import { generate } from '@genql/cli'
import { rootDebug } from '@joystream/sdk-core/utils/debug'
import { generateEntityInfo } from './generateEntityInfo'

const APPS = ['queryNode', 'orion', 'storageSquid'] as const

const PKG_ROOT_PATH = path.join(__dirname, '..')

function appRootPath(appName: string) {
  return path.join(PKG_ROOT_PATH, appName)
}

function generatedFilesPath(appName: string) {
  return path.join(appRootPath(appName), '__generated__')
}

async function buildQueryApiTemplate() {
  const queryApiTemplatePath = path.join(__dirname, 'templates', 'QueryApi.ts')
  const queryApiTemplate = (await fs.readFile(queryApiTemplatePath)).toString()
  return queryApiTemplate
    .split('\n')
    .filter((l) => !l.includes(`{% CUT %}`))
    .join('\n')
}

// Workaround for https://github.com/ardatan/graphql-tools/issues/4777
async function withDisabledDebug<T>(
  func: (...args: unknown[]) => Promise<T>
): Promise<T> {
  const debugEnvVal = process.env.DEBUG
  delete process.env.DEBUG
  const result = await func()
  process.env.DEBUG = debugEnvVal
  return result
}

async function main() {
  const debug = rootDebug.extend('codegen')
  for (const appName of APPS) {
    debug(`Generating an API for ${_.startCase(appName)} GraphQL server`)
    const appDebug = debug.extend(appName)
    appDebug(
      `Removing old generated files from ${generatedFilesPath(appName)}...`
    )
    await fs.rm(generatedFilesPath(appName), { recursive: true, force: true })
    const genQLApiPath = path.join(generatedFilesPath(appName), 'genql')
    appDebug(`Generating GenQL api at ${genQLApiPath}...`)
    const schema = (
      await fs.readFile(path.join(appRootPath(appName), 'schema.graphql'))
    ).toString()
    await withDisabledDebug(() =>
      generate({
        schema,
        output: genQLApiPath,
        scalarTypes: {
          DateTime: 'string',
          BigInt: 'string',
          BigDecimal: 'string',
          Bytes: 'string',
        },
      })
    )

    // Generate entity info
    const entityInfoPath = path.join(
      generatedFilesPath(appName),
      'entityInfo.ts'
    )
    appDebug(`Extracting entity info to ${entityInfoPath}...`)
    const genQLTypesModulePath = path
      .relative(
        __dirname,
        path.join(generatedFilesPath(appName), 'genql', 'types')
      )
      .replace(path.sep, '/')
    const { default: genQLTypes } = await import(genQLTypesModulePath)
    await generateEntityInfo(genQLTypes, entityInfoPath)
    // "Generate" Query API
    const queryApiPath = path.join(generatedFilesPath(appName), 'QueryApi.ts')
    appDebug(`Building the QueryApi.ts from template to ${queryApiPath}...`)
    await fs.writeFile(queryApiPath, await buildQueryApiTemplate())
    appDebug('Done')
  }
  debug('Codegen completed')
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
