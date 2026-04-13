// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  setupFiles: ['reflect-metadata', '<rootDir>/test/helpers/loadEnv.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json',
    }],
  },
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  cache: false,
  clearMocks: true,
};

export default config;