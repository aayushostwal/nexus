---
name: nexus-shorts
description: >
  Use this skill when the user wants to turn any content into a YouTube Shorts script. Trigger phrases
  include: "write a YouTube Short script for X", "make a shorts script about X", "turn this into a
  YouTube Short", "write a 30-second script", "create a script for YouTube Shorts", "I need a short
  video script", "write a hook and script for X", "make this into a short-form video script",
  "write a script for a reel or short", "give me a YouTube Short on X". Also trigger when the user
  pastes any content — a topic, article, bullet points, code snippet, or URL — and asks for a
  short-form video script or YouTube content. When in doubt, use this skill.
---

# Nexus YouTube Shorts Script Writer

Turn any input into a ready-to-record 30-second YouTube Shorts script: hook, core content, and CTA.

---

## Compatibility
- Input: any format — topic keyword, bullet points, article text, URL, raw notes, code snippet
- Output: spoken script (~75–80 words) + optional B-roll/overlay production notes
- No external tools required

---

## Workflow

### Step 1 — Parse Input & Infer Tone
Extract from the user's input:
1. **Core message**: the single most interesting or useful thing to convey — state it in one sentence
2. **Audience**: infer from content — developers, students, general audience, creatives, etc.
3. **Tone**: pick from the table below based on content type and any user signals

| Tone | When to use | Voice style |
|------|-------------|-------------|
| Tech/Educational | Code, tools, tutorials, "how to" | Calm, precise — "here's how it works" |
| Casual/Discovery | Personal tips, life hacks, finds | Energetic — "okay so I just found out..." |
| Dramatic | Big reveals, contrarian takes | Intense, punchy, short sentences |
| Controversial | Unpopular opinions, hot takes | Bold, direct — "unpopular opinion:" |

Default to **Tech/Educational** if context is ambiguous. Only ask the user if the content fits two very different tones equally.

### Step 2 — Write the Hook (3 seconds / 8–12 words)
The hook must stop a viewer mid-scroll. Generate one hook per pattern, pick the strongest three:

| Pattern | Template | Example |
|---------|----------|---------|
| Shocking stat | "[X]% of [audience] don't know [fact]." | "90% of devs don't know Python does this." |
| Bold claim | "This [thing] [result] me [benefit]." | "This one decorator saved me 200 lines of code." |
| Direct question | "Are you still doing [X] the hard way?" | "Are you still writing SQL joins by hand?" |
| Pattern interrupt | "Stop. Nobody talks about [X]." | "Stop. Nobody talks about FastAPI's hidden feature." |

Present all 3 hook variants to the user. Do not pick one for them — they know their audience best.

### Step 3 — Write the Core Content (20 seconds / 50–55 words)
If the user hasn't specified, ask: *"Should the core summarize the topic, or ask the viewer a question to engage them?"*

**Mode A — Summary:** 3 punchy sentences. Each sentence = one clear fact, step, or insight.

**Mode B — Question/Engagement:** State the problem (1 sentence) → hint at the solution (1 sentence) → tease more detail, e.g. "and there's a catch I'll cover in part 2."

Rules for both modes:
- No sentence longer than 15 words
- No jargon without a one-word definition immediately after it
- Every sentence must deliver one discrete piece of value — cut filler words ruthlessly

### Step 4 — Write the CTA (5 seconds / 12–15 words)
Use one of these templates. Do not write a generic "like and subscribe" — it converts near zero:

| CTA type | Template |
|----------|----------|
| Subscribe ask | "Follow for one [topic] trick every day. You won't regret it." |
| Comment engagement | "Drop a [emoji] in the comments if this saved you time." |
| Question hook | "What's YOUR go-to trick for [topic]? Tell me below." |
| Series tease | "Part 2 drops [day]. Follow so you don't miss it." |

Pick the CTA that fits the tone. Content that naturally invites discussion → Comment or Question type.

### Step 5 — Assemble & Word Count
Join: `[Chosen Hook] + [Core Content] + [CTA]`

Count total words. Target: **75–80 words**.
- Over 80 words: cut one sentence from core content, not the hook or CTA.
- Under 70 words: add one concrete detail or example to the core.

### Step 6 — Production Notes (optional)
Add 3–5 bullet suggestions for:
- What to show on screen during the hook (face cam, code editor, product demo, screen recording)
- Key phrases to display as on-screen text overlays (bold the phrase in the script to signal this)
- Where to cut or transition

---

## Output Format

```
## YouTube Short Script — [Topic]
**Tone:** [Tech/Educational | Casual | Dramatic | Controversial]
**Word Count:** [N] words (~[N] seconds)

---

### Hook Options (pick one before recording)
1. [Hook variant A]
2. [Hook variant B]
3. [Hook variant C]

---

### Full Script (using Hook 1)

[Hook — 8–12 words]

[Core content — 50–55 words, 3 sentences max]

[CTA — 12–15 words]

---

### Production Notes
- Hook visual: [what to show on screen]
- Overlay: "[key phrase]" as on-screen text when mentioned
- Cut at: [moment in the script]
```

---

## Anti-Patterns
- Never write a hook longer than 12 words — the viewer scrolls before the content starts.
- Never write a generic CTA like "like and subscribe if you enjoyed this" — name a specific action.
- Never exceed 80 words total — at normal speaking pace this runs past 30 seconds and gets cut off by the platform.
- Never use passive voice — "This saves you time" not "Time can be saved by this."
- Never write core content that requires external context — every Short must be fully self-contained.
- Never pick the hook for the user — always present 3 variants and let them choose.
- Never pad to hit word count — add a concrete detail or example, not filler words.

---

## Examples

**Input:** "Python has a built-in `functools.cache` decorator that memoizes function results automatically."

**Step 1:** Core message = "functools.cache makes memoization one line of code." Audience = Python developers. Tone = Tech/Educational.

**Output:**
```
## YouTube Short Script — Python functools.cache
**Tone:** Tech/Educational
**Word Count:** 78 words (~30 seconds)

---

### Hook Options (pick one before recording)
1. "90% of Python devs write memoization from scratch. You don't have to."
2. "This one decorator eliminates an entire class of bugs. Forever."
3. "Are you still writing your own cache logic? Stop."

---

### Full Script (using Hook 1)

90% of Python devs write memoization from scratch. You don't have to.

Python's built-in **@cache** decorator from functools stores your function's results automatically.
Call it once with the same inputs — it returns instantly from cache. No dict, no logic, no bugs.
Add it above any pure function and you're done. It even handles recursive Fibonacci with zero
extra code.

Follow for one Python trick every day. You won't regret it.

---

### Production Notes
- Hook visual: face cam with surprised reaction, cut immediately to code editor
- Overlay: "@cache" in large text when first mentioned
- Cut at: "you're done" — quick zoom into the decorator in the editor before CTA
```

---

**Input:** "I want to make a Short about why most people fail at building habits."

**Step 1:** Core message = "habit failure = wrong environment, not wrong willpower." Audience = general. Tone = Controversial.

**Output hook options:**
```
1. "Unpopular opinion: your habits aren't failing. Your environment is."
2. "Nobody tells you this about building habits. It's not about discipline."
3. "You don't need more willpower. You need a better room."
```

---

## Writing/Content Specialization

**Hook quality rubric** — score each hook before presenting; lead with the highest scorer:

| Signal | Score |
|--------|-------|
| Creates a knowledge gap (viewer thinks "wait, really?") | +1 |
| Under 12 words | +1 |
| Names the audience or a universal pain point | +1 |
| Avoids "in this video I will…" | +1 |
| Works without any visual context (audio-only test) | +1 |

**Tone calibration by platform signal:**
- User says "Short" or "Shorts" → YouTube; punchy, fast pacing
- User says "Reel" → Instagram; slightly warmer, more visual storytelling focus
- User says "TikTok" → casual + conversational, first-person anecdote if possible

**Pacing self-check:** Read the assembled script aloud before delivering. If it can't be spoken naturally in 28–32 seconds at a comfortable pace, it's the wrong length — trim or expand before output.
