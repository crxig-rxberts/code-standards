#!/usr/bin/env node
import { runOne } from "./lib.mjs";

runOne("npm", (files) => ["run", "format:pre-commit", "--", ...files]);
