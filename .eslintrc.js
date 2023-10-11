module.exports = {
  extends: ['@payloadcms'],
  parserOptions: {
    project: ['./tsconfig.json'], // Specify it only for TypeScript files
  },
  rules: {
    // add specific rules configurations here
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-implicit-any-catch': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    'jsx-a11y/heading-has-content': 'off',
    'import/no-default-export': 'off',
  },
}
