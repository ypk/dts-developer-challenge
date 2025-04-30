import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    prettierConfig,
    {
        rules: {
            'no-console': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error', {
                    'argsIgnorePattern': '^_'
                }
            ],
            '@typescript-eslint/explicit-module-boundary-types': 'off'
        }
    }
);