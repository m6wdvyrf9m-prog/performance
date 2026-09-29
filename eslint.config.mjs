import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**",
      "coverage/**",
      "outputs/**",
      "work/**"
    ],
  },
];

export default eslintConfig;
