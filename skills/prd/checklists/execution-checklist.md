# PRD Execution Checklist

## Pre-flight

- [ ] Read the original ask in full; one sentence of it is quoted in the doc
- [ ] Destination known: HTML in the user's doc store (default) or Markdown in the repo
- [ ] The reader is known (a team, a manager, a reviewer), which sets the depth
- [ ] The user's decisions so far are listed, each topic merged into one line
- [ ] Any earlier doc revision has been read before editing it; edits build on it

## Evidence

- [ ] Each table, endpoint and job the design touches has been found in code (path:line)
- [ ] The entry point of every service that would run new code has been found
- [ ] Shared resources (DB cluster, connection pool, queue) are identified from infra code
- [ ] Retention, TTLs and size caps are read from config; live values are checked where the design depends on them
- [ ] Every claim about a live system carries a date and a method, or "not verified"

## Writing

- [ ] Problem: 3 bullets plus the decision needed
- [ ] The user's proposal has been challenged; alternatives have a one-line why-not
- [ ] One chosen design in the body
- [ ] Flow diagram, plus a sequence diagram if the flow has more than 3 hops; new parts highlighted
- [ ] Live example: numbered steps, actor named, payload shown, resulting rows shown, dropped data shown
- [ ] "Will it slow anything down?" has one bullet per touched system
- [ ] "If something breaks" lists 3+ failures with what the user sees
- [ ] Data safety section if PII/PHI is involved, with an allow-list by default
- [ ] Decisions: *Made by you* (dated) and *Still open* (owner or next step)
- [ ] Plan of at most 5 steps, plus an undo line
- [ ] Reviewer details collapsed: schema, alternatives, what was checked

## Output review

- [ ] Zero tables that explain concepts
- [ ] No unexplained jargon
- [ ] Under ~30 KB of HTML
- [ ] Rendered at desktop, 390px and dark: 0 overflow, 0 JS errors
- [ ] Every SVG has been screenshot and looked at, with no overlapping labels

## Post-delivery

- [ ] Published as a new revision of the same asset (same link)
- [ ] Chat summary: what changed, the link, which calls were the assistant's, at most 1 question
- [ ] Before a share or send: recipient access checked, message drafted rather than sent
