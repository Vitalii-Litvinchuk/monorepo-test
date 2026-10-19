module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@dzencode/contracts$': '<rootDir>/../../packages/contracts/src',
    '^@dzencode/contracts/(.*)$': '<rootDir>/../../packages/contracts/src/$1',
  },
};
