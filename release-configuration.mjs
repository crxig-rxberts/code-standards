// Shared release-it settings, consumed by .release-it.mjs (root) and
// .release-it.workspace.mjs (the published package).
// Designed to be copy-pasted as-is into other repos — the only
// Project-specific bits are `packageName` and `workspacePaths` below.

// Tag/changelog/release-name prefix for the workspace-scoped release line,
// E.g. "commit-hooks-v1.2.3", and the directory holding that package's
// Files. Change per project.
const packageName = "commit-hooks",
  workspaceDir = `packages/${packageName}`,
  // Files that make up the published package. A commit that doesn't touch
  // Any of these never bumps/tags/releases the workspace line. package.json
  // Stays at repo root regardless of workspaceDir.
  workspacePaths = [`${workspaceDir}/index.mjs`, `${workspaceDir}/bin`, "package.json"],
  changelogPreset = {
    name: "conventionalcommits",
    types: [
      { section: "Features", type: "feat" },
      { section: "Bug Fixes", type: "fix" },
      { section: "Performance Improvements", type: "perf" },
      { section: "Code Refactoring", type: "refactor" },
      { section: "Documentation", type: "docs" },
      { section: "Code Style Changes", type: "style" },
      { section: "Tests", type: "test" },
      { section: "Build Changes", type: "build" },
      { section: "Continuous Integration", type: "ci" },
      { section: "Chores", type: "chore" },
      { section: "Reverts", type: "revert" },
    ],
  },
  hooks = {
    "before:init": "git fetch --prune --prune-tags origin",
  };

// Tracks every commit to main regardless of type. Tags v${version}, never
// Touches package.json's version, never publishes. Repo-wide activity log,
// Decoupled from the published package's own version line.
// oxlint-disable-next-line one-var
export const rootRelease = {
  git: {
    // oxlint-disable-next-line no-template-curly-in-string
    commitMessage: "chore: release v${version} [skip ci]",
    requireCommits: true,
    requireCommitsFail: false,
    // oxlint-disable-next-line no-template-curly-in-string
    tagAnnotation: "Release v${version}",
    tagMatch: "v[0-9]*.[0-9]*.[0-9]*",
    // oxlint-disable-next-line no-template-curly-in-string
    tagName: "v${version}",
  },
  github: {
    release: true,
    // oxlint-disable-next-line no-template-curly-in-string
    releaseName: "v${version}",
  },
  hooks,
  npm: false,
  plugins: {
    "@release-it/conventional-changelog": {
      infile: "CHANGELOG.md",
      preset: changelogPreset,
    },
  },
};

// Scoped to workspacePaths. Only bumps package.json's version, tags, and
// Releases when a commit actually touches the published package, so
// CI/docs/renovate/dependency-chore-only commits never bump the package or
// Trigger a publish. The publish workflow gates on this tag pattern.
// oxlint-disable-next-line one-var
export const workspaceRelease = {
  git: {
    commitMessage: `chore(${packageName}): release v\${version} [skip ci]`,
    requireCommits: true,
    requireCommitsFail: false,
    tagAnnotation: `Release ${packageName}-v\${version}`,
    tagMatch: `${packageName}-v[0-9]*.[0-9]*.[0-9]*`,
    tagName: `${packageName}-v\${version}`,
  },
  github: {
    release: true,
    releaseName: `${packageName}-v\${version}`,
  },
  hooks,
  npm: {
    publish: false,
  },
  plugins: {
    "@release-it/conventional-changelog": {
      // Scopes both the version-bump recommendation and the changelog
      // Content to commits that touch workspacePaths.
      commitsOpts: { path: workspacePaths },
      gitRawCommitsOpts: { path: workspacePaths },
      infile: `${workspaceDir}/CHANGELOG.md`,
      preset: changelogPreset,
    },
  },
};
