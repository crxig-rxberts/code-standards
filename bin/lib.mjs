import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ARGV_FILES_START = 2,
  EXIT_SUCCESS = 0,
  EXIT_FAILURE = 1,
  stagedFiles = () => process.argv.slice(ARGV_FILES_START),
  resolveOwnBin = (binName) =>
    fileURLToPath(new URL(`../node_modules/.bin/${binName}`, import.meta.url)),
  runOne = (command, args) => {
    const result = spawnSync(command, args(stagedFiles()), { stdio: "inherit" });

    if (result.status !== EXIT_SUCCESS) {
      process.exit(EXIT_FAILURE);
    }
    process.exit(EXIT_SUCCESS);
  },
  runPerDirectory = (command, argsForDir) => {
    const dirs = [...new Set(stagedFiles().map((file) => dirname(file)))],
      results = dirs.map((dir) => spawnSync(command, argsForDir(dir), { stdio: "inherit" })),
      failed = results.some((result) => result.status !== EXIT_SUCCESS);

    if (failed) {
      process.exit(EXIT_FAILURE);
    }
    process.exit(EXIT_SUCCESS);
  };

export { resolveOwnBin, runOne, runPerDirectory };
