# Foundation migration notes

These changes repair catalog drift and normalize skill identity. Regenerate the catalog when adding, renaming, or removing a skill, command, or agent.

## Removed command documentation

The previously advertised `review-branch`, `add-todo`, `daily-brief`, and `stats` commands were not shipped. They are not aliases.

| Previous advertised command | Current path |
| --- | --- |
| `review-branch` | Ask Claude to delegate a read-only review to `code-reviewer` |
| `add-todo` / `daily-brief` | Ask to use the `nexus` skill; external integrations require separate setup |
| `stats` | No equivalent shipped command; use host usage information |

The shipped command catalog is generated in [README](../README.md#shipped-catalog). For implementation through PR creation, use `software-engineer`.

## Skill names

Skill frontmatter names now match their directories. Replace old `nexus-debugging`, `nexus-observability`, `nexus-performance`, `nexus-reliability`, `nexus-shorts`, `nexus-testing`, and `nexus-tutorial` references with `debugging`, `observability`, `performance`, `reliability`, `shorts`, `testing`, and `tutorial`. Replace `nexus-skill-writer-md` with `skill-writer`. The `token-optimizer` name is unchanged; older README labels incorrectly called it `nexus-token-optimizer`. The plugin namespace remains separate: for example, Claude invokes `/nexus:debugging`. Refresh installed plugins or reinstall through your installer to update discovered names; old names are not guaranteed aliases.

## Codex global instructions

Codex guidance belongs in `AGENTS.md`, plural. Earlier bootstrap versions targeted `AGENT.md`. Preview the new bootstrap with `--runtime codex --dry-run`, then apply it. Review the old singular file for user-authored content before removing anything manually. Never delete a whole instruction file just to remove Nexus guidance. Use `--remove --dry-run` to preview managed-block cleanup supported by this version.

## Release validation

Source checks, offline workflow scenarios, and a website build are separate from live host installation and end-to-end GitHub access. Record actual host smoke-test results rather than inferring success from a generated catalog.

Releases now run through an explicit `Release` workflow dispatch on `main`. Choose `major` for this foundation update because discovered skill identities change, `minor` for future compatible features, and `patch` for fixes. Merging a PR no longer publishes a version automatically.
