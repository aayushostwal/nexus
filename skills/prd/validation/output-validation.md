# PRD Output Validation

## Trigger test

Should activate on:
- "write a PRD for X"
- "prepare a plan from this Slack thread"
- "create a design doc with prototypes"
- "the doc is too complex, simplify it"
- "add an LLD diagram"
- "send this proposal to my manager"

Should not activate on:
- a one-line chat answer ("explain in simple words")
- a code review
- a commit message
- a README for a library

## Completeness test

- [ ] The original ask is quoted
- [ ] Every load-bearing fact has a source (path:line, command and date) or is marked unverified
- [ ] The entry point of each touched service has been found, so "where it runs" is answered
- [ ] The user's decisions have been extracted from the conversation, not invented

## Output test (contract)

- [ ] **findings:** the doc exists at a stated path, and its published revision or link is given
- [ ] **evidence:** a "what was checked, and how" list is inside the doc
- [ ] **confidence:** High, Medium or Low, with a reason, in the chat summary
- [ ] **risks:** "Still open" decisions and unmeasured costs are listed
- [ ] **recommendations:** one chosen design, with alternatives collapsed
- [ ] **next_actions:** a plan of at most 5 steps, plus what the user must answer

## Readability test

- [ ] Concept tables: 0
- [ ] The live example has at least 4 numbered steps, with actual payloads and actual stored rows
- [ ] At least one diagram; a sequence diagram for flows over 3 hops
- [ ] Under ~30 KB of HTML, or the long material is collapsed
- [ ] A new reader can say which process does each step after one pass

## Engineering intelligence test

- [ ] Hot-path cost is named for every touched service
- [ ] The shared-resource contention is stated
- [ ] Failure handling covers loss, retry and backlog beyond retention
- [ ] The user's proposal was critiqued, not just adopted

## Confidence test

- **High:** every claim the design depends on was verified in code or a live system, with a date.
- **Medium:** the design holds, but named numbers are unmeasured (load, size, latency).
- **Low:** a key fact (compliance rule, prod config, an existing hook) is unverified. Say which one.
