#!/usr/bin/env node
import { runOne } from "./lib.mjs";

runOne("npm", (files) => ["run", "lint:pre-commit", "--", ...files]);
