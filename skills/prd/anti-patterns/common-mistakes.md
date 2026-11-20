# PRD Common Mistakes

1. **Word dump**
   - *Looks like:* long sections of prose, every detail in the body.
   - *Fails because:* the reader cannot find the design.
   - *Instead:* problem, picture, live example; collapse the rest.

2. **Concept tables**
   - *Looks like:* pros/cons grids, term glossaries, option matrices.
   - *Fails because:* readers skip them and cannot tell what they add.
   - *Instead:* bullets or a diagram. Tables are only for data rows and schemas.

3. **Prose-only flow**
   - *Looks like:* "When a node finishes, the executor strips fields and queues the record."
   - *Fails because:* there is no picture of who calls whom, so the reader has zero confidence.
   - *Instead:* a sequence diagram with one lane per process and numbered messages.

4. **Unlocated code**
   - *Looks like:* "a job on the API does X".
   - *Fails because:* the reader asks where it runs and whether it shares resources.
   - *Instead:* name the process (handler, goroutine, new service) and whether it is new or existing.

5. **Undefined jargon**
   - *Looks like:* flatten, ingest, payload tier, idempotent upsert, leaf.
   - *Fails because:* the reader stops at the first unknown word.
   - *Instead:* plain words ("one row per value", "saves", "a retry writes the same row").

6. **Overclaimed isolation**
   - *Looks like:* "this never affects runs".
   - *Fails because:* shared databases and connection pools make it false, and reviewers know it.
   - *Instead:* name the shared resource and say measured or not measured.

7. **Yes-man design**
   - *Looks like:* the user proposes "a pipeline reading the engine via hooks" and the doc adopts it as is.
   - *Fails because:* hidden costs (no hook exists, polling load) surface in review.
   - *Instead:* state the strengths and weaknesses honestly and propose the better variant.

8. **Decision log as chat history**
   - *Looks like:* five entries for five rounds on the same topic, or the assistant's ideas listed as the user's.
   - *Fails because:* the outcome is buried and ownership is wrong.
   - *Instead:* one dated line per topic, *Made by you* only, with open items separate.

9. **Deny-list for sensitive data**
   - *Looks like:* "remove patient_name, mrn, dob".
   - *Fails because:* a new field with sensitive data passes through.
   - *Instead:* store only fields that are explicitly picked.

10. **Unchecked hand-off**
    - *Looks like:* sending an owner-only link, or messaging the reviewer directly.
    - *Fails because:* the reader cannot open the doc, or a message goes out unreviewed.
    - *Instead:* check access, create a draft, and ask before sharing.
