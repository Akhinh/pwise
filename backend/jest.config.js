// ============================================================
// PrepWise — Jest Configuration
// ============================================================

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'node',
      },
    }],
  },
  moduleNameMapper: {
    '^@prepwise/types$': '<rootDir>/../packages/types/src/index.ts',
    '^@prepwise/utils$': '<rootDir>/../packages/utils/src/index.ts',
  },
  collectCoverageFrom: ['src/modules/**/*.ts', '!src/**/*.routes.ts'],
};