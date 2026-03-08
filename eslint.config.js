import css from '@eslint/css';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierConfig from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import vitestPlugin from '@vitest/eslint-plugin';
import unicornPlugin from 'eslint-plugin-unicorn';
import regexpPlugin from 'eslint-plugin-regexp';
import perfectionist from 'eslint-plugin-perfectionist';

// Scope JS/TS plugin configs to non-CSS files so they don't cascade into CSS
const jsOnly = { ignores: ['**/*.css'] };

export default tseslint.config(
  { ...js.configs.recommended, ...jsOnly },
  ...tseslint.configs.strictTypeChecked.map((c) => ({ ...c, ...jsOnly })),
  ...tseslint.configs.stylisticTypeChecked.map((c) => ({ ...c, ...jsOnly })),
  { ...perfectionist.configs['recommended-natural'], ...jsOnly },
  { ...unicornPlugin.configs.recommended, ...jsOnly },
  { ...prettierConfig, ...jsOnly },
  {
    ...jsOnly,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Conflicts with no-non-null-assertion: one says "use !" and the other forbids it
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',

      // Disable unicorn rules that are too opinionated for this project
      // These must be here (not in the src/ block) so they also apply to e2e tests
      'unicorn/filename-case': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-spread': 'off', // Spreading NodeList/HTMLCollection gives any[]
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  {
    files: ['packages/*/src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'import-x': importX,
      regexp: regexpPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import-x/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // Strict TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowFunctionsWithoutTypeParameters: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
      ],
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: true,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: false,
          allowNullableString: true,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false, // Allow async event handlers in JSX
          },
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off', // Needed for noUncheckedIndexedAccess
      '@typescript-eslint/no-unnecessary-condition': 'off', // Too many false positives
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Import ordering and validation
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
          pathGroups: [{ pattern: '@ingglish/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc' },
        },
      ],
      'import-x/no-duplicates': 'error',
      'import-x/first': 'error',
      'import-x/no-cycle': 'warn',

      // Disable perfectionist rules that conflict with import-x and typescript-eslint
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-named-imports': 'off',
      '@typescript-eslint/adjacent-overload-signatures': 'off',

      // Regexp rules (recommended preset)
      ...regexpPlugin.configs['flat/recommended'].rules,

      // React rules
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Accessibility rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',

      // General strict rules — allow warn/error for legitimate error reporting
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  // Vitest rules (test files only)
  {
    files: ['**/*.test.{ts,tsx}'],
    ...vitestPlugin.configs.recommended,
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      'vitest/no-conditional-expect': 'off', // Data-driven tests use conditional expects
      'vitest/valid-title': 'off', // Dynamic describe/it titles from loops
    },
  },
  {
    // Extension has no logging infrastructure — console is the only debug tool
    files: ['packages/extension/src/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/scripts/**',
      'eslint.config.js',
      // Config files in all packages
      '**/*.config.js',
      '**/*.config.ts',
      '**/vitest.setup.ts',
      // Auto-generated dictionary files and their type declarations
      'packages/dictionary/src/data/**/*.js',
      'packages/dictionary/src/data/**/*.d.ts',
      'packages/dictionary/src/cmudict.js',
      'packages/dictionary/src/cmudict.d.ts',
      'packages/dictionary/src/reverse-cmudict.js',
      'packages/dictionary/src/reverse-cmudict.d.ts',
      // Auto-generated data files in core
      'packages/core/src/data/**',
      'packages/core/src/dictionary/**',
    ],
  },
  // CSS linting
  {
    files: ['**/*.css'],
    language: 'css/css',
    ...css.configs.recommended,
    rules: {
      ...css.configs.recommended.rules,
      'css/no-invalid-properties': 'off', // Can't validate CSS custom properties (var(--*))
      'css/use-baseline': 'off', // We target modern browsers; baseline warnings are noise
      'css/no-important': 'off', // Existing !important usage is intentional overrides
      'css/font-family-fallbacks': 'off', // All fonts use CSS vars; only fires on `inherit` button resets
    },
  }
);
