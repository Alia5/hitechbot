module.exports = {
    extends: [
        "airbnb-typescript/base",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
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
    },
    rules: {
        "import/export": "off",
        "import/prefer-default-export": "off",
        "import/named": "off",
        "indent": 0,
        "no-void": 0,
        "@typescript-eslint/indent": ["warn", 4],
        "linebreak-style": ["error", "unix"],
        "no-tabs": "error",
        "quotes": ["warn", "single"],
        "no-unused-expressions": 1,
        "no-unused-vars": 1,
        "no-unused-labels": 1
    }
  };