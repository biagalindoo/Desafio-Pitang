/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  moduleNameMapper: {
    "\\.(css)$": "<rootDir>/src/tests/styleMock.ts"
  },
  testMatch: ["<rootDir>/src/**/*.test.tsx"]
};

