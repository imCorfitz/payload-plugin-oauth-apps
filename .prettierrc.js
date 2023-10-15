module.exports = {
  overrides: [
    {
      files: ["src/**/*.{ts,tsx,js,jsx}", "dev/**/*.{ts,tsx,js,jsx}"],
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
