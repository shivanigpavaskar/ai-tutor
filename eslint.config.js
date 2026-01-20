import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      'comma-dangle': 'off',
      'import/no-unresolved': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'react/jsx-filename-extension': [1, { extensions: ['.ts', '.tsx'] }],
      'react/jsx-no-bind': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/destructuring-assignment': 'off',
      'react/no-danger': 'off',
      'arrow-body-style': 'off',
      'no-nested-ternary': 'off',
      'no-console': 'off',
      'no-plusplus': 'off',
      'no-param-reassign': 0,
      'react-hooks/exhaustive-deps': 'off',
      semi: 'off',
      'import/extensions': 'off',
      'multiline-ternary': 'off',
      '@typescript-eslint/semi': ['off'],
      '@typescript-eslint/explicit-function-return-type': ['off'],
      '@typescript-eslint/strict-boolean-expressions': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'react/function-component-definition': 'off',
    },
  },
];
