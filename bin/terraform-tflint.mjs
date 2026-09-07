#!/usr/bin/env node
import { runPerDirectory } from "./lib.mjs";

runPerDirectory("tflint", (dir) => ["--chdir", dir]);
