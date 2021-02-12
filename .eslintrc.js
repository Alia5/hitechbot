module.exports = {
    extends: [
        'airbnb-typescript',
        "plugin:@typescript-eslint/recommended",
        'eslint:recommended'
    ],
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint'
    ],
    parserOptions: {
        ecmaVersion: 2019,
        project: './tsconfig.json'
    },
    env: {
        node: false,
        browser: true
    }
  };