import { oxfmtConfig, oxlintConfig } from "../index.mjs";
import { strict as assert } from "node:assert";
import { test } from "node:test";

test("oxlintConfig returns all four categories set to error", () => {
  assert.deepEqual(oxlintConfig(), {
    categories: {
      correctness: "error",
      perf: "error",
      style: "error",
      suspicious: "error",
    },
  });
});

test("oxlintConfig returns a fresh object on every call", () => {
  const first = oxlintConfig();
  first.categories.correctness = "warn";

  assert.equal(oxlintConfig().categories.correctness, "error");
});

test("oxfmtConfig returns an empty ignorePatterns list", () => {
  assert.deepEqual(oxfmtConfig(), { ignorePatterns: [] });
});

test("oxfmtConfig returns a fresh array on every call", () => {
  const first = oxfmtConfig();
  first.ignorePatterns.push("*.json");

  assert.deepEqual(oxfmtConfig().ignorePatterns, []);
});
