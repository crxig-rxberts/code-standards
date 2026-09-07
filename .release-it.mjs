export default {
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
  hooks: {
    "before:init": "git fetch --prune --prune-tags origin",
  },
  npm: {
    publish: false,
  },
  plugins: {
    "@release-it/conventional-changelog": {
      infile: "CHANGELOG.md",
      preset: {
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
    },
  },
};
