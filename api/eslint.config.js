import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/', 'coverage/', 'uploads/'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Tests TypeScript nativos (ADR-0005): parser TS sin type-check; las
    // reglas JS recomendadas siguen activas, solo se ajusta lo que el
    // parser propio ya resuelve (no-undef sobre tipos).
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'no-undef': 'off',
    },
  },
];
