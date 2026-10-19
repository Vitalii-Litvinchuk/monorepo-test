module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'unicorn', 'import'],
  rules: {
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
      },
    ],
    'import/no-duplicates': 'error',
  },
};
