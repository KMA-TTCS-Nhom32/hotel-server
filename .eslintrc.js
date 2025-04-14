module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules'],
  rules: {
    // General best practices
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-return-await': 'error',
    // 'no-unused-vars': 'off',
    eqeqeq: ['error', 'always'],

    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    // '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/ban-types': 'error',

    // NestJS conventional code style
    '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],

    // Code style (integrated with Prettier)
    // 'prettier/prettier': [
    //   'error',
    //   {
    //     singleQuote: true,
    //     trailingComma: 'all',
    //     printWidth: 100,
    //     tabWidth: 2,
    //     endOfLine: 'auto',
    //   },
    // ],
  },
};
