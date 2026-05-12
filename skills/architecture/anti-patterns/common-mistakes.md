# Common Architecture Mistakes

1. Decomposing by technology instead of domain responsibility.
2. Moving boundaries without observability or rollback.
3. Treating shared libraries as a shortcut for shared ownership.
4. Ignoring data ownership and consistency contracts.
5. Running large rewrites instead of incremental extraction.

## Fix Pattern
For each mistake: constrain scope, add measurements, and ship reversible increments.
