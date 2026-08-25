import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist']),

  // Application : navigateur, React, JSX.
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Les noms capitalisés sont des composants. Sans eslint-plugin-react,
      // ESLint ne voit pas qu'un paramètre destructuré comme `Icon` est
      // utilisé en JSX : d'où le même motif sur les arguments que sur les
      // variables. `_` préfixe ce qu'on écarte volontairement.
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^(_|[A-Z])' },
      ],

      // Les contextes exportent volontairement un provider et son hook côté à
      // côte. Le signal reste utile ailleurs, mais ne doit pas faire échouer
      // le lint sur une architecture assumée.
      'react-refresh/only-export-components': 'warn',

      // Remettre un état à zéro dans le corps d'un effet (« pas de foyer, on
      // vide ») est légitime ici. On garde l'avertissement, pas l'erreur.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // Scripts d'administration et de vérification : Node, pas de React.
  // Sans ce bloc, `process`, `console` et consorts étaient signalés comme
  // indéfinis et `npm run lint` échouait sur l'ensemble du dossier.
  {
    files: ['scripts/**/*.js', '*.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
])
