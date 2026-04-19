// ============================================================
// PrepWise — Auth Service Tests
// ============================================================

// jest.config.js (place in backend/)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '@prepwise/types': '<rootDir>/../packages/types/src/index.ts',
    '@prepwise/utils': '<rootDir>/../packages/utils/src/index.ts',
  },
  collectCoverageFrom: ['src/modules/**/*.ts', '!src/**/*.routes.ts'],
};
