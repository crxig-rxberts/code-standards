import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { resolveOwnBin, runOne, runPerDirectory } from "../bin/lib.mjs";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { test } from "node:test";
import { tmpdir } from "node:os";

class ProcessExitSignalError extends Error {
  constructor(code) {
    super(`process.exit(${code})`);
    this.name = "ProcessExitSignalError";
    this.code = code;
  }
}

const EXIT_SUCCESS = 0,
  EXIT_FAILURE = 1,
  DIR_ARG_INDEX = 0,
  ARGV_PREFIX = ["node", "script.mjs"],
  withArgv = (files, run) => {
    const original = process.argv;

    process.argv = [...ARGV_PREFIX, ...files];
    try {
      run();
    } finally {
      process.argv = original;
    }
  },
  /* The mock must throw to unwind control flow, since process.exit() never
     really returns — a no-op mock would let execution fall through to
     whatever the source runs next, which the real function never allows. */
  withMockedExit = (testContext, run) => {
    const exits = [];

    testContext.mock.method(process, "exit", (code) => {
      exits.push(code);
      throw new ProcessExitSignalError(code);
    });

    try {
      run();
    } catch (error) {
      if (!(error instanceof ProcessExitSignalError)) {
        throw error;
      }
    }
    return exits;
  };

test("resolveOwnBin resolves to node_modules/.bin next to bin/", () => {
  const resolved = resolveOwnBin("markdownlint-cli2");

  assert.ok(resolved.endsWith(join("node_modules", ".bin", "markdownlint-cli2")));
});

test("runOne exits 0 when the command succeeds", (testContext) => {
  const exits = withMockedExit(testContext, () => {
    withArgv(["a.js", "b.js"], () => {
      runOne(process.execPath, () => ["-e", `process.exit(${EXIT_SUCCESS})`]);
    });
  });

  assert.deepEqual(exits, [EXIT_SUCCESS]);
});

test("runOne exits 1 when the command fails", (testContext) => {
  const exits = withMockedExit(testContext, () => {
    withArgv([], () => {
      runOne(process.execPath, () => ["-e", `process.exit(${EXIT_FAILURE})`]);
    });
  });

  assert.deepEqual(exits, [EXIT_FAILURE]);
});

test("runOne forwards staged files to the args builder", (testContext) => {
  withMockedExit(testContext, () => {
    withArgv(["a.js", "b.js"], () => {
      runOne(process.execPath, (files) => {
        assert.deepEqual(files, ["a.js", "b.js"]);
        return ["-e", `process.exit(${EXIT_SUCCESS})`];
      });
    });
  });
});

test("runPerDirectory invokes the command once per unique directory", (testContext) => {
  const recordDir = mkdtempSync(join(tmpdir(), "code-standards-test-")),
    recordFile = join(recordDir, "calls.jsonl"),
    // Node -e "<script>" <args...> puts <args...> starting at process.argv[1]
    // — there's no separate script-path slot to skip like a real .mjs file.
    recordScript = `require("node:fs").appendFileSync(process.env.RECORD_FILE, JSON.stringify(process.argv.slice(1)) + "\\n")`,
    originalRecordFile = process.env.RECORD_FILE,
    stagedFiles = ["a/one.tf", "a/two.tf", "b/three.tf"],
    expectedDirs = ["a", "b"];

  process.env.RECORD_FILE = recordFile;

  try {
    withMockedExit(testContext, () => {
      withArgv(stagedFiles, () => {
        runPerDirectory(process.execPath, (dir) => ["-e", recordScript, dir]);
      });
    });

    const calls = readFileSync(recordFile, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    assert.equal(calls.length, expectedDirs.length);
    assert.deepEqual(calls.map((call) => call[DIR_ARG_INDEX]).toSorted(), expectedDirs);
  } finally {
    process.env.RECORD_FILE = originalRecordFile;
    rmSync(recordDir, { force: true, recursive: true });
  }
});

test("runPerDirectory exits 1 if any directory's command fails", (testContext) => {
  const exitCodeFor = (dir) => {
      if (dir === "bad") {
        return EXIT_FAILURE;
      }
      return EXIT_SUCCESS;
    },
    exits = withMockedExit(testContext, () => {
      withArgv(["ok/one.tf", "bad/two.tf"], () => {
        runPerDirectory(process.execPath, (dir) => ["-e", `process.exit(${exitCodeFor(dir)})`]);
      });
    });

  assert.deepEqual(exits, [EXIT_FAILURE]);
});

test("runPerDirectory exits 0 when every directory's command succeeds", (testContext) => {
  const exits = withMockedExit(testContext, () => {
    withArgv(["a/one.tf", "b/two.tf"], () => {
      runPerDirectory(process.execPath, () => ["-e", `process.exit(${EXIT_SUCCESS})`]);
    });
  });

  assert.deepEqual(exits, [EXIT_SUCCESS]);
});
