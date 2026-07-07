module.exports = {
  env: { node: true, es2022: true, jest: true },
  parserOptions: { ecmaVersion: 2022 },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'no-process-exit': 'off',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  ignorePatterns: ['node_modules/', 'coverage/', 'logs/']
}
