module.exports = {
  overrides: [
    {
      files: ["src/**/*.ts", "src/**/*.tsx"],
      options: {
        printWidth: 100,
        parser: "typescript",
        semi: false,
        singleQuote: true,
        trailingComma: "all",
        arrowParens: "avoid",
      },
    },
  ],
};
