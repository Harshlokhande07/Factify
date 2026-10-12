import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXText[value=/\\b(true|false|fake|real|hoax|debunked|verdict|trust score|credibility score|reliability)\\b/i]",
          message: "Factify Operating Invariant: UI cannot display truth claims, verdicts, or reliability scores.",
        },
        {
          selector: "JSXAttribute[name.name!='className'] > Literal[value=/\\b(fake|real|hoax|debunked|verdict|trust score|credibility score|reliability)\\b/i]",
          message: "Factify Operating Invariant: UI attributes cannot contain verdict, reliability, or truth claim words.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "data/demo.ts",
    "tests/**",
  ]),
]);

export default eslintConfig;
