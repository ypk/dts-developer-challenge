import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

// Function for base TypeScript rules
function getBaseRules(args) {
    return {
        'no-console': args,
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-unsafe-argument': args,
        '@typescript-eslint/no-unsafe-assignment': args,
        '@typescript-eslint/no-unsafe-call': args,
        '@typescript-eslint/no-unsafe-member-access': args,
        '@typescript-eslint/no-explicit-any': args,
        '@typescript-eslint/unbound-method': args,
        '@typescript-eslint/no-unused-vars': args,
        '@typescript-eslint/no-namespace': args,
        '@typescript-eslint/no-unsafe-function-type': args,
        '@typescript-eslint/no-require-imports': args,
        '@typescript-eslint/only-throw-error': args,
    }
}

// Function for files to completely ignore
function getIgnoredFiles() {
    return {
        ignores: [
            'coverage/**',
            'dist/**',
            'prisma/**',
            'eslint.config.mjs',
            'jest.config.js'
        ]
    };
}

// Function for base TypeScript config
function getBaseConfig() {
    return [
        eslint.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        {
            languageOptions: {
                parserOptions: {
                    allowDefaultProject: true,
                    project: './tsconfig.json',
                    projectService: true,
                    tsconfigRootDir: import.meta.dirname,
                },
            },
        },
        prettierConfig
    ];
}

// Function for non-src files that need special handling
function getNonSrcConfig() {
    return {
        files: [
            'coverage/**/*',
            'dist/**/*',
            '*.config.js',
            '*.config.mjs',
            'prisma/**/*',
            'scripts/**/*'
        ],
        ignores: ['**/*.d.ts'],
        languageOptions: {
            parserOptions: {
                project: null,
            },
        },
        rules: getBaseRules('off'),
    };
}

// Function for src files rules
function getSrcFilesConfig() {
    return {
        files: [
            'src/**/*.ts',
            'src/*.ts',
        ],
        rules: {
            ...getBaseRules('off'),
            '@typescript-eslint/no-unused-vars': [
                'error', {
                    'argsIgnorePattern': '^_|^next$'
                }
            ],
        }
    };
}

// Function for test files rules
function getTestFilesConfig() {
    return {
        files: [
            'src/__tests__/**/*.test.ts',
            'src/__tests__/*.test.ts',
        ],
        rules: getBaseRules('off'),
    };
}

export default tseslint.config(
    getIgnoredFiles(),
    ...getBaseConfig(),
    getNonSrcConfig(),
    getSrcFilesConfig(),
    getTestFilesConfig(),
);
