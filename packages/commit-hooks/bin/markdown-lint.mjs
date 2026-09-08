#!/usr/bin/env node
import { resolveOwnBin, runOne } from "./lib.mjs";

runOne(resolveOwnBin("markdownlint-cli2"), (files) => files);
