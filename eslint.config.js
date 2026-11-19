import js from '@eslint/js';
import globals from 'globals';

export default [
    { ignores: ['node_modules/', 'vendor/'] },
    js.configs.recommended,
    {
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: { ...globals.browser, countUp: 'readonly' }
        }
    },
    {
        files: ['scripts/**/*.mjs', 'eslint.config.js'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node }
    }
];
