module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  rules: {
  '@typescript-eslint/no-unused-vars': 'warn',
  'no-unused-vars': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'off',
    // Allow leading underscores (e.g., _area) in identifiers
    '@typescript-eslint/naming-convention': [
      'error',
      {
        "selector": "variable",
        "format": ["_", "camelCase", "UPPER_CASE", "PascalCase", "snake_case"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "parameter",
        "format": ["camelCase", "PascalCase", "snake_case"],
        "leadingUnderscore": "allow"
      },
    ],
  },
  env: {
    node: true,
    es6: true,
  },
};