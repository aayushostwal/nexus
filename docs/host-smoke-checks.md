# Manual host smoke checks

Use an isolated host profile and a disposable GitHub repository. Record Nexus revision, host version, installer version, date, and evidence for each outcome. The checklist includes model-driven checks; the results below distinguish completed CLI checks from checks that have not run.

1. Install Nexus into a clean Claude Code profile using the documented marketplace flow. Confirm the generated catalog's commands, skills, and agents are discoverable.
2. Invoke `commit-message` with an empty index and confirm it reports nothing staged. Stage an intentional fixture change and confirm it drafts a message without committing.
3. Invoke `software-engineer` with a reproducible fixture issue and explicit PR authorization. Verify the fix, relevant checks, correct PR base/head, and honest CI status. Confirm it neither merges nor deploys.
4. Repeat the issue workflow with a chat bug, a directory-only request, unrelated dirty files, and unavailable GitHub authentication. Confirm preserved work and an accurate blocked result where appropriate.
5. Install into a clean Codex profile with the chosen installer. Verify skill discovery and invocation by the name actually shown. Record unsupported commands, subagent registration, or memory behavior rather than assuming parity.
6. Preview bootstrap for each runtime. Apply twice and verify idempotence and preservation of custom instruction text. Remove the managed block and verify custom text remains. Inspect legacy singular Codex files separately.
7. Upgrade from the previous release, refresh discovery, and verify renamed skills and migration instructions. Uninstall using the host/installer, then remove optional managed guidance.

Publish a result table with pass/fail/not-run and evidence. Do not use real secrets or private source in fixtures or reports.

## Recorded local CLI smoke — 2026-09-30

Tested the foundation working tree based on upstream `1.35.0` in separate temporary `CLAUDE_CONFIG_DIR` and `CODEX_HOME` directories. The tested tree includes uncommitted foundation changes; this is not evidence for an already published release. No model calls, GitHub writes, or changes to the real user configuration were made.

| Check | Result | Evidence |
| --- | --- | --- |
| Claude Code 2.1.285 marketplace validation | Pass | `claude plugin validate . --json` returned success, no warnings. |
| Claude plugin manifest validation | Pass | Initial validation identified missing description frontmatter in `commands/grind.md`. After adding it, `claude plugin validate .claude-plugin/plugin.json --strict --json` passed with zero warnings. |
| Claude local marketplace add and plugin install | Pass | `marketplace add` and `install nexus@nexus-marketplace` returned success in the temporary profile. |
| Claude component discovery | Pass | `plugin details nexus@nexus-marketplace` listed 13 skills (11 skill directories plus two commands), including `software-engineer`, and 14 agents. Hooks, MCP servers, and LSP servers were all zero. |
| Claude uninstall | Pass | Uninstall succeeded; subsequent `plugin list --json` returned `[]`. |
| Codex CLI 0.157.1 local marketplace add and install | Pass | `plugin marketplace add` and `plugin add nexus@nexus-marketplace --json` succeeded; list reported version `1.35.0`, installed and enabled. |
| Codex removal | Pass | `plugin remove nexus@nexus-marketplace --json` succeeded; subsequent marketplace-filtered list contained no installed plugins. |
| Model-driven skill invocation and Codex component routing | Not run | CLI installation/discovery does not establish execution behavior. |
| GitHub issue-to-PR execution | Not run | The offline regression fixture is separate evidence, not a live agent evaluation. |
| Upgrade from previous release and remote marketplace fetch | Not run | This run used fresh local-path marketplace installations. |

To reproduce installation checks without changing a real profile, create temporary directories with `mktemp -d`, set `CLAUDE_CONFIG_DIR` for each Claude command and `CODEX_HOME` for each Codex command, then use the local repository path as the marketplace source. Do not overwrite `HOME`. Remove the installed plugin before discarding the temporary profiles. Follow the checklist above separately for model-driven checks and upgrades.
