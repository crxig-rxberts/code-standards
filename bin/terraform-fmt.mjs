#!/usr/bin/env node
import { runPerDirectory } from "./lib.mjs";

runPerDirectory("terraform", (dir) => ["fmt", dir]);
