// https://oxc.rs/docs/guide/usage/formatter/config.html
// NOTE: not auto-discovered — invoke oxfmt with `-c oxfmt.config.mjs`
import { oxfmtConfig } from "./index.mjs";

export default {
  ...oxfmtConfig(),
};
