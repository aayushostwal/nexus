# Cost And Token Policy

- Use the smallest capable model for summarization, classification, and formatting.
- Use stronger reasoning models for architecture, debugging, production changes, and security review.
- Prefer reading summaries, manifests, and targeted files before loading large logs or full repos.
- Before large external searches, broad repo scans, deployments, or bulk MCP reads, state the expected scope.
- Track task evidence: files read, commands run, tests run, and external tools used.
- Compact or summarize long-running sessions before context becomes noisy.
