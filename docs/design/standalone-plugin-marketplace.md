# Standalone Plugin Marketplace Design

## Context

`agent-browser` is owned in its upstream repository at `vercel-labs/agent-browser`
and is mirrored into the Accelerate Data fork at
`accelerate-data/agent-browser`. It should be distributed as its own plugin
source instead of being copied into `engineering-skills`.

The upstream repository already owns the runtime, CLI, package metadata, and
skill discovery stub. The Accelerate Data fork should add only the integration
surface needed for internal marketplace installation and keep those files small
enough to survive regular upstream syncs.

## Goals

- Keep `agent-browser` as a standalone plugin source repository.
- Preserve upstream source history and continue syncing from
  `vercel-labs/agent-browser`.
- Add Claude and Codex plugin manifests at the repository root.
- Register the Accelerate Data fork in the internal plugin marketplace under the
  Coding category.
- Avoid duplicating `agent-browser` skill content in `engineering-skills`.

## Non-Goals

- Do not move or rewrite the upstream `skills/agent-browser/SKILL.md` discovery
  stub.
- Do not move feature documentation out of `skill-data/core/`.
- Do not add internal marketplace entries to this repository. Marketplace index
  changes belong in `plugin-marketplace`.
- Do not publish local `./plugins/` entries from the marketplace repo.

## Repository Shape

The standalone plugin source should expose:

```text
.
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── .codex-plugin/
│   └── plugin.json
├── skills/
│   └── agent-browser/
├── skill-data/
│   └── core/
└── package.json
```

The root plugin manifests should use the package version from `package.json` and
point skills at `./skills`. The skill itself remains the upstream thin discovery
stub that directs agents to load the core skill through `agent-browser skills get
core`.

## Upstream Sync

Add a scheduled GitHub Actions workflow in the fork:

- Checkout `main` with full history.
- Add `https://github.com/vercel-labs/agent-browser.git` as `upstream`.
- Fetch `upstream/main`.
- Merge `upstream/main` into the fork's `main`.
- Push the result to `accelerate-data/agent-browser`.

The workflow should use a normal merge, not a hard reset, so the fork-retained
plugin manifests and marketplace integration files remain in history. If
upstream changes conflict with those files, the workflow should fail and require
manual resolution.

## Marketplace Registration

The internal marketplace is `plugin-marketplace`.

Claude marketplace entry:

- Add `agent-browser` to `.claude-plugin/marketplace.json`.
- Use `source: "url"` with
  `https://github.com/accelerate-data/agent-browser.git`.
- Keep entries sorted alphabetically.
- Bump `.claude-plugin/marketplace.json.metadata.version`.
- Do not add a `version` field to the marketplace entry.

Codex marketplace entry:

- Add `agent-browser` to `.agents/plugins/marketplace.json`.
- Use `source: "url"` with
  `https://github.com/accelerate-data/agent-browser.git`.
- Set `category` to `Coding`.
- Include the standard installation and authentication policy fields used by
  the existing Accelerate Data-owned plugins.
- Keep Claude and Codex marketplace entries in parity.

## Validation

For `agent-browser`:

```bash
python3 -m json.tool .claude-plugin/plugin.json >/dev/null
python3 -m json.tool .codex-plugin/plugin.json >/dev/null
git diff --check
```

For `plugin-marketplace`:

```bash
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
python3 scripts/validate-marketplace.py
python3 scripts/check-plugin-version-bump.py --base-ref origin/main
```

For `engineering-skills` after removal:

```bash
npm run validate:plugin-manifests
npm run eval:coverage
npm run eval:codex-compatibility
```

## Rollout

1. Remove `skills/agent-browser` from `engineering-skills` and bump its plugin
   manifests because plugin content changed.
2. Add standalone plugin manifests and upstream sync workflow in
   `agent-browser`.
3. Register `agent-browser` in `plugin-marketplace` as a Coding plugin.
4. Validate all three repositories.
5. Commit the repositories independently so ownership boundaries remain clear.
