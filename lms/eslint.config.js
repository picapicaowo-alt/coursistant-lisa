import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const legacyIgnores = [
  'dist',
  // Legacy JS/JSX — out of scope until migration (PROJECT_STANDARDS.md §13).
  'src/**/*.jsx',
  'src/**/*.js',
  // Type-quarantined legacy hotspots.
  'src/components/ChatContent.tsx',
  'src/components/RichTextEditor/extensions/BlankNode.ts',
  'src/pages/DetailWorkspacePage/**',
  'src/stores/core/**',
  'src/types/core/**',
  'src/pages/CourseWorkspacePage/components/AssignmentsList/**',
  'src/pages/CourseWorkspacePage/components/CourseUnitsManager/**',
  'src/pages/CourseWorkspacePage/components/CourseUnitPanel/**',
  'src/pages/CourseWorkspacePage/components/CourseInfoPanel/**',
]

export default [
  {ignores: legacyIgnores},
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ...config.languageOptions,
      globals: globals.browser,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        ecmaFeatures: {jsx: true},
      },
    },
    settings: {react: {version: '18.3'}},
    plugins: {
      ...config.plugins,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...config.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'error',
        {allowConstantExport: true, allowExportNames: ['useAuth', 'useRequiredAuth']},
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    },
  })),
]
