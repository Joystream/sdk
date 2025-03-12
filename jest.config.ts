import { createJsWithTsPreset, JestConfigWithTsJest } from 'ts-jest'

const packages = ['core']
const environments = ['node', 'jsdom']

const jestConfig: JestConfigWithTsJest = {
  projects: [
    ...packages
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
      .flat(),
    {
      displayName: 'Docs',
      testMatch: [`<rootDir>/docs/**/*.test.ts`],
      ...createJsWithTsPreset({
        tsconfig: `<rootDir>/docs/tsconfig.json`,
      }),
    },
  ],
}

export default jestConfig
