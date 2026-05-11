// jest.config.ts
/** @type {import('jest').Config} */

const config = {
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

module.exports = config;