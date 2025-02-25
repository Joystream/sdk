import { createJsWithTsPreset, JestConfigWithTsJest } from 'ts-jest'

const packages = ['core']
const environments = ['node', 'jsdom']

const projects = packages
  .map((pkg) =>
    environments.map((env) => ({
      displayName: `@joystream/sdk-${pkg} (${env})`,
      testMatch: [`<rootDir>/packages/${pkg}/**/*.test.ts`],
      ...createJsWithTsPreset({
        tsconfig: `<rootDir>/packages/${pkg}/tsconfig.json`,
      }),
      moduleNameMapper: {
        '^@joystream/sdk-core/(.*)$': '<rootDir>/packages/core/src/$1',
      },
    }))
  )
  .flat()

const jestConfig: JestConfigWithTsJest = {
  projects,
}

export default jestConfig
