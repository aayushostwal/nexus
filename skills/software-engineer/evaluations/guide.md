# Offline workflow evaluation

These are evaluation inputs and acceptance criteria, not claims of measured agent
performance or successful live GitHub installation. `verify-fixture.cjs` establishes
only that the supplied bug reproduces and that a reference correction satisfies the
fixture assertions. It does not evaluate an agent or contact GitHub.

Run the fixture check from the repository root:

```sh
node skills/software-engineer/evaluations/verify-fixture.cjs
```

For a behavioral evaluation, give a fresh agent the skill, one scenario's `prompt`
and `setup`, and the raw fixture files where relevant. Keep `required` and `forbidden`
as evaluator-only criteria. Copy fixtures into a temporary Git repository; never
run an evaluation in a user's working tree. Provide read-only/mocked GitHub
responses and a local bare remote when needed. Do not contact or mutate the sample
`example/fixture` repository. Mock PR creation and return explicitly synthetic URLs.

Capture tool calls, changes, verification output, and final response. Score each
required behavior as observed, absent, or not assessable, with evidence. Any forbidden
behavior fails the scenario. Do not award publication success for a draft body or
an unverified tool result. Record host/model version, revision, runtime, token use
when available, and whether the run was offline. Compare against the same tasks
without the skill before making effectiveness claims. Live host installation and
real GitHub lifecycle tests require separate authorized environments.

The fixture check deliberately lives outside automatic test filename discovery:
the input repository is supposed to contain a bug.
