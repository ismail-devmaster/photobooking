module.exports = {
    env: {
      node: true,
      es2021: true,
      jest: true
    },
    parser: "@typescript-eslint/parser",
    parserOptions: { ecmaVersion: 2020, sourceType: "module" },
    plugins: ["@typescript-eslint"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "prettier"
    ],
    rules: {}
  };
  