import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // 1. Thay thế cho file .eslintignore
  {
    ignores: ['dist', 'coverage', 'docs/static', 'esm-temp', 'esm']
  },

  // 2. Cấu hình cơ bản cho JS (eslint:recommended)
  pluginJs.configs.recommended,

  // 3. Cấu hình cho TypeScript (plugin:@typescript-eslint/recommended)
  ...tseslint.configs.recommended,

  // 4. Cấu hình Prettier (plugin:prettier/recommended)
  // Cái này phải để cuối cùng để nó tắt các rule conflict
  eslintPluginPrettierRecommended,

  // 5. Cấu hình Custom (Rules & Env cũ của bạn)
  {
    languageOptions: {
      // Thay thế cho env: { browser: true, node: true... }
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.commonjs,
        ...globals.es2021
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      // Các rule cũ bạn đã config
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Lưu ý: rule camelcase đã bị deprecate ở bản mới,
      // nếu muốn dùng bạn nên đổi sang @typescript-eslint/naming-convention
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/no-empty-function': 'off'
    }
  }
];
