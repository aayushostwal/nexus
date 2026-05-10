# Shorts Content Heuristics

Practical decision rules for producing high-quality, high-converting YouTube Short scripts.

---

## Hook Quality Scoring Rubric

Score each hook variant before presenting. Lead with the highest-scoring variant. Present all three regardless of score differences — the user knows their audience best.

| Signal | Score |
|--------|-------|
| Creates a knowledge gap (viewer thinks "wait, really?") | +1 |
| Under 12 words | +1 |
| Names the audience or a universal pain point | +1 |
| Avoids "in this video I will…" / "today I'll show you…" | +1 |
| Works without any visual context (audio-only test) | +1 |

**Maximum score: 5/5**

**Minimum acceptable score to include in the 3 variants: 3/5.** If all 3 generated hooks score below 3, regenerate — don't present weak hooks.

**Tiebreaker:** If two hooks have the same score, prefer the one that creates a stronger knowledge gap. Knowledge-gap hooks perform most consistently across platforms.

---

## Tone Selection Rules

When the user's content fits multiple tone categories, apply these rules in order:

| Rule | Tone selected |
|------|--------------|
| Content contains a specific code snippet, tool, or technique | Tech/Educational |
| Content is a personal tip or habit the creator discovered | Casual/Discovery |
| Content challenges a widely-held belief (contrarian take) | Controversial |
| Content is a "most people don't know X" revelation without being contrarian | Tech/Educational (Shocking stat pattern) |
| Content is about a product launch, big news, or significant change | Dramatic |
| Content is ambiguous | Default to Tech/Educational |

**Rule:** Only ask the user about tone if the content fits two very different tones equally (e.g., equally Controversial and Tech/Educational). Otherwise, infer and state the tone in the output.

**Platform tone calibration:**
- User says "Short" or "Shorts" → YouTube; prioritize punchy pacing, faster sentence rhythm
- User says "Reel" → Instagram; warmer, slightly more visual storytelling, emotion-driven
- User says "TikTok" → casual + conversational, first-person anecdote preferred if possible

---

## When a Topic Is Too Broad for a Single Short

A topic is too broad when it would require more than 3 sentences of core content to give the viewer one complete, actionable takeaway.

**Signals that the topic is too broad:**
- The core message sentence contains the word "and" connecting two distinct ideas
- The topic requires explaining a concept before delivering the insight (> 1 setup sentence)
- The topic is an overview of a larger subject ("everything about Docker", "how machine learning works")
- Writing the core content naturally produces 5+ sentences before hitting 80 words total

**What to do when the topic is too broad:**
1. Ask the user: "This topic has a few directions — which angle is most interesting to you?" and offer 2–3 specific sub-topics as options.
2. Alternatively, pick the single sharpest angle yourself and note: "I've focused on [specific angle] — let me know if you'd like a different angle instead."

**Examples of too-broad vs specific:**
| Too broad | Specific (Single Short) |
|-----------|------------------------|
| "Python tips for developers" | "Python's @cache decorator eliminates manual memoization" |
| "Why Docker is useful" | "Docker's --no-cache flag forces a clean rebuild — use it when layers get stale" |
| "How to build habits" | "Habit failure comes from environment design, not willpower" |
| "Kubernetes explained" | "Kubernetes liveness probes restart stuck pods automatically — without human intervention" |

---

## Pacing Self-Check

Before delivering the script, read it aloud at a comfortable speaking pace (not fast). The script should complete in 28–32 seconds.

**If it runs long (> 32 seconds):**
- Cut one sentence from core content — always from core content, never from hook or CTA
- Remove filler phrases: "basically", "essentially", "you know", "the thing is"
- Replace multi-word phrases with single words: "in order to" → "to", "at this point in time" → "now"

**If it runs short (< 28 seconds):**
- Add one concrete detail or specific example to the core content
- Add a specific number where a vague statement exists: "saves time" → "saves 20 minutes per deploy"
- Never add filler words to pad length
