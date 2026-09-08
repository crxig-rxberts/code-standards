// https://oxc.rs/docs/guide/usage/linter/config.html
// NOTE: not auto-discovered — invoke oxlint with `--config oxlint.config.mjs`
import { oxlintConfig } from "./packages/commit-hooks/index.mjs";

export default {
  ...oxlintConfig(),
};
