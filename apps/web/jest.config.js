module.exports = {
  testEnvironment: 'jsdom',
  testRegex: '.*\\.spec\\.(ts|tsx)$',
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@dzencode/contracts$': '<rootDir>/../../packages/contracts/src',
    '^@dzencode/contracts/(.*)$': '<rootDir>/../../packages/contracts/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/test/style-mock.js',
  },
};
