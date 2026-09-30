# GitHub operations

Use a connected GitHub tool when available, or `gh` with an authenticated account.
Check availability without printing tokens. If neither is available, still complete
locally verifiable work from the user's issue description and prepare a PR body.
Issue discovery without any GitHub access is blocked; do not invent issue metadata.

## Establish identity and check existing work

Run read-only commands in the resolved repository. These are examples with values
you must verify, not executable placeholders to copy unchanged:

```sh
git rev-parse --show-toplevel
git status --short
git branch --show-current
git worktree list
git remote -v
gh auth status
gh repo view --json nameWithOwner,defaultBranchRef,isFork,parent
```

Do not reproduce remote URLs containing embedded credentials in user output.
Use an explicit `--repo owner/repo` for issue and PR commands after establishing
identity, particularly for forks. An issue number alone is relative to that target.

```sh
gh issue list --repo owner/repo --state open --limit 20 --json number,title,labels,assignees,url
gh issue view 123 --repo owner/repo --json number,title,body,state,url,comments,assignees
gh pr list --repo owner/repo --state open --search '123' --json number,title,url,body,headRefName,baseRefName
```

Inspect linked development activity via a connector, GitHub page, or API when the
CLI result does not expose it. Search relevant keywords as well; a PR can omit the
issue number. A closed issue or merged fix requires checking whether the reported
failure persists before starting new work.

## Branch and PR creation

Determine both the target base repository and push destination. In a fork workflow,
the base usually belongs to upstream and the head to the fork. Verify instead of
assuming. Use the user's supplied base when provided; otherwise use the verified
default branch. Keep existing user commits outside the new branch's diff.

Use a unique worktree directory outside the original checkout when isolation is
needed. Never delete an existing path or worktree to free a preferred name. Read
repository setup instructions before installing dependencies or running hooks.

Write the PR body with a file-writing tool or a safely quoted literal heredoc. Do
not place issue titles/bodies in shell-evaluated strings; backticks, `$()`, quotes,
newlines, and leading option characters must remain data. Prefer structured tool
arguments. The following command illustrates the `--body-file` shape with fixed
sample values:

```sh
gh pr create --repo owner/repo --base main --head fix/issue-123 \
  --title 'Fix the issue summary' --body-file /absolute/path/pr-body.md
```

Use `--head fork-owner:branch` for an established fork destination, and `--draft`
when requested or when verification is materially incomplete. Preserve a useful
local body if network publication fails. Do not place secrets in it.

After publication, read back actual metadata:

```sh
gh pr view 456 --repo owner/repo --json url,baseRefName,headRefName,isDraft,mergeable,statusCheckRollup
```

A permission failure is not a reason to request broader token scopes automatically,
change credentials, bypass branch protection, or retry mutations repeatedly. Finish
unblocked local work and explain the minimum missing access. Never run a merge or
deployment command as part of this workflow.
