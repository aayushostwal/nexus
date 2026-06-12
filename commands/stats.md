---
description: Show token usage and estimated cost stats for Claude and Codex sessions.
---

Run Nexus stats with optional flags.

Examples:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js" stats
node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js" stats --summary
node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js" stats --last 50
node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js" stats --source claude
node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js" stats --source codex --session <session-id>
```
