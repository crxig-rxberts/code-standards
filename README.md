# code-standards

## Table of Contents

- [Prerequisites](#prerequisites)
- [Purpose](#purpose)
- [Hooks](#hooks)
- [Usage](#usage)
- [Development](#development)
- [Releasing](#releasing)
- [Support Information](#support-information)

## Prerequisites

- Node >=22
- [`prek`](https://github.com/j178/prek) on PATH (`cargo install --locked prek`, `brew install prek`, `pip install prek`, or `npm add -D @j178/prek`)
- `oxlint` and `oxfmt` as devDependencies in the consuming repo
- `terraform` and `tflint` on PATH for repos with Terraform
- Python 3 on PATH (prek needs it to install `code-standards-commit-msg`'s isolated environment)
- CI: [`j178/prek-action`](https://github.com/j178/prek-action)

## Purpose

Centralized code standards for `crxig-rxberts` projects, distributed two ways from one repo:

- **Pre-commit hooks**: this repo is itself a pre-commit hook source (`.pre-commit-hooks.yaml`) — consumers reference it via a single `repo:`/`rev:` block in their own `.pre-commit-config.yaml`; prek clones and installs it automatically. No separate `repo:` blocks for Terraform, Markdown, or commit-msg linting — they're all consolidated here so a version bump is one `rev:`, one Renovate PR, across every consuming project.
- **Base oxlint/oxfmt config**: an importable npm module (`oxlintConfig()`/`oxfmtConfig()`) published to npm.

Both are versioned together under the `commit-hooks-v*` git tag — bumped only when the hook/package code (`index.mjs`, `bin/`, `package.json`) actually changes, not on every push to `main`. Pin `rev:`/`@version` to that tag. A separate `v*` tag/GitHub Release tracks all repo activity (CI, docs, dependency chores) for a full history, but doesn't move the pre-commit pin or trigger an npm publish — see [Releasing](#releasing).

## Hooks

| Hook                              | Description                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-standards-js-lint`          | Runs `npm run lint:pre-commit` (oxlint) in the consumer repo against staged files                                                                                                           |
| `code-standards-js-format`        | Runs `npm run format:pre-commit` (oxfmt) in the consumer repo against staged files                                                                                                          |
| `code-standards-terraform-fmt`    | Runs `terraform fmt` per directory against staged Terraform files                                                                                                                           |
| `code-standards-terraform-tflint` | Runs `tflint --chdir` per directory against staged Terraform files                                                                                                                          |
| `code-standards-markdown-lint`    | Runs markdownlint-cli2 against staged Markdown files — bundled as our own dependency, no consumer install needed. Skips `CHANGELOG.md`/`CHANGELOG-*.md` (auto-generated, not hand-authored) |
| `code-standards-commit-msg`       | Conventional-commit message linting via the `conventional-pre-commit` PyPI package — installed by prek automatically, no consumer dependency needed                                         |

The JS hooks pass **staged filenames only**, appended after `--`, so `lint:pre-commit`/`format:pre-commit` must not use `.` or glob patterns themselves.

## Usage

1. Install the base config — `--save-exact` still pins whatever `@latest` resolves to as an exact version in `package.json`:

   ```bash
   npm install --save-dev --save-exact @crxig-rxberts/code-standards@latest
   ```

2. Add the npm scripts:

   ```json
   "scripts": {
     "lint:pre-commit": "oxlint --config oxlint.config.mjs",
     "format:pre-commit": "oxfmt -c oxfmt.config.mjs"
   }
   ```

3. Create `oxlint.config.mjs`, spreading the base and adding any project-specific overrides:

   ```js
   import { oxlintConfig } from "@crxig-rxberts/code-standards";

   export default {
     ...oxlintConfig(),
   };
   ```

4. Create `oxfmt.config.mjs`, same pattern:

   ```js
   import { oxfmtConfig } from "@crxig-rxberts/code-standards";

   export default {
     ...oxfmtConfig(),
   };
   ```

5. Create `.pre-commit-config.yaml`:

   ```yaml
   default_install_hook_types: [commit-msg, pre-commit]
   repos:
     - repo: https://github.com/crxig-rxberts/code-standards
       rev: <version> # pin to a commit-hooks-v* tag, e.g. commit-hooks-v0.1.0 — Renovate bumps this
       hooks:
         - id: code-standards-js-lint
         - id: code-standards-js-format
         - id: code-standards-terraform-fmt
         - id: code-standards-terraform-tflint
         - id: code-standards-markdown-lint
         - id: code-standards-commit-msg
   ```

   Drop the two Terraform hook ids (and the `tflint`/`terraform` prerequisite) if the repo has no Terraform.

6. Create `.markdownlint-cli2.mjs`:

   ```js
   export default {
     config: {
       default: true,
       MD013: false,
     },
   };
   ```

7. Create `.tflint.hcl` — only if the repo has Terraform:

   ```hcl
   plugin "terraform" {
     enabled = true
     preset  = "recommended"
   }
   ```

8. Install the git hooks:

   ```bash
   prek install
   prek install --hook-type commit-msg
   ```

9. Verify:

   ```bash
   prek run --all-files
   ```

10. CI: add [`j178/prek-action`](https://github.com/j178/prek-action) to run `prek run --all-files` against the committed `.pre-commit-config.yaml`.

## Development

Working on `code-standards` itself, not consuming it:

```bash
git clone https://github.com/crxig-rxberts/code-standards.git
cd code-standards
nvm use   # picks up the version pinned in .nvmrc
npm install
prek install
prek install --hook-type commit-msg
```

Verify before pushing:

```bash
prek run --all-files
```

`oxlint.config.mjs`/`oxfmt.config.mjs` at the repo root import from `packages/commit-hooks/index.mjs` directly (not the published package) — this repo dogfoods the exact same base config it publishes. `.pre-commit-config.yaml` at the root calls the `packages/commit-hooks/bin/*.mjs` scripts directly as local hooks rather than referencing this repo via `repo:`/`rev:`, since it can't reference its own not-yet-tagged state.

## Releasing

`packages/commit-hooks/` holds everything that makes up the published package — `index.mjs`, `bin/`, its tests, and `.release-it.workspace.mjs` — except `package.json` itself, which has to stay at the repo root (pre-commit's `language: node` hook install reads `package.json` from wherever the hook repo's root is; `bin`/`exports`/`files` inside it can point anywhere, so they point into `packages/commit-hooks/`).

`.github/workflows/release.yml` runs on every push to `main` and executes [`release-it-containerized`](https://github.com/juancarlosjr97/release-it-containerized) twice, against two configs that share settings via `release-configuration.mjs`:

- **`packages/commit-hooks/.release-it.workspace.mjs`** (tag `commit-hooks-v*`) — scoped to `packages/commit-hooks/index.mjs`, `packages/commit-hooks/bin/`, and `package.json`. Only bumps `package.json`'s version, tags, and writes `packages/commit-hooks/CHANGELOG.md` + a GitHub Release when a commit actually touches the published package. Runs first. `.github/workflows/publish.yml` triggers on this tag and runs `npm publish` — so a CI-only, docs-only, or dependency-chore-only commit never republishes to npm.
- **`.release-it.mjs`** (tag `v*`) — unscoped, tracks every commit to `main` regardless of type. Writes `CHANGELOG.md` + a GitHub Release for repo-wide history, but never touches `package.json`'s version and never triggers a publish.

`release-configuration.mjs` is written to be copy-pasted into other repos as-is — the only project-specific bits are the `packageName` and `workspacePaths` constants at the top.

One-time repo setup required before this works:

- `RELEASE_IT_GITHUB_TOKEN` secret — a PAT with `contents: write` (the default `GITHUB_TOKEN` isn't accepted by the action)
- `NPM_TOKEN` secret — an npm automation token with publish access to `@crxig-rxberts`
- `GIT_EMAIL` / `GIT_USERNAME` secrets — identity for the release commit

## Support Information

- [CHANGELOG](./CHANGELOG.md) — repo-wide history, generated by release-it on every release
- [packages/commit-hooks/CHANGELOG](./packages/commit-hooks/CHANGELOG.md) — published-package history, generated only when the package itself changes
