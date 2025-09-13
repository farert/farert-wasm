/**
 * ESLint Configuration for TypeScript Examples
 *
 * Comprehensive linting rules specifically designed for the TypeScript
 * integration examples, ensuring code quality and consistency.
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
    'node',
    'promise'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:node/recommended',
    'plugin:promise/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: [
      './tsconfig.json',
      './tsconfig.strict.json',
      './tsconfig.dev.json',
      './tsconfig.build.json'
    ],
    tsconfigRootDir: __dirname,
    createDefaultProgram: true
  },

  // === Environment Configuration ===
  env: {
    node: true,
    es2020: true,
    jest: true
  },

  // === TypeScript-Specific Rules ===
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    '@typescript-eslint/explicit-function-return-type': 'off', // Relaxed for examples
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-readonly': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'warn',

    // Import ordering and resolution
    'import/order': ['error', {
      'groups': [['builtin', 'external', 'internal']],
      'newlines-between': 'always'
    }],
    'import/no-unresolved': 'off', // TypeScript handles this
    'import/named': 'off', // TypeScript handles this

    // Node.js specific
    'node/no-missing-import': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-extraneous-import': 'off',

    // General code quality
    'no-console': 'off', // Examples may use console
    'no-debugger': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'warn'
  },

  // === Settings ===
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          './tsconfig.json',
          './tsconfig.strict.json',
          './tsconfig.dev.json',
          './tsconfig.build.json'
        ]
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },

  // === File-specific Overrides ===
  overrides: [
    {
      // Relaxed rules for example files
      files: ['examples/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off'
      }
    },
    {
      // Strict rules for type definition files
      files: ['types/**/*.ts', 'types/**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-explicit-any': 'error'
      }
    },
    {
      // Configuration files
      files: ['*.config.js', '*.config.ts', '.eslintrc.js'],
      env: {
        node: true
      },
      rules: {
        'node/no-unpublished-require': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
};