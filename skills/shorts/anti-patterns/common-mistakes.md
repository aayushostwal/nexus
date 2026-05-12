# Shorts Anti-Patterns

Common mistakes that produce scripts that don't convert, run too long, or feel weak on camera. Each entry includes the failure mode and the correction.

---

## 1. Generic "Like and Subscribe" CTAs

**What it looks like:**
```
Like this video and subscribe if you enjoyed it!
```
Or:
```
Hit the like button and let me know in the comments!
```

**Why it happens:**
It's the default CTA pattern. Every YouTube tutorial uses it. It feels safe.

**Why it's harmful:**
- "Like if you enjoyed it" converts near zero — it requires the viewer to have already decided they enjoyed it
- It gives the viewer nothing specific to do
- It signals low effort — viewers who want quality content disengage
- It doesn't create a reason to follow (future value is not articulated)

**Correction:**
Every CTA must name a specific action and give a specific reason:

| Bad | Good |
|-----|------|
| "Like and subscribe if you enjoyed this" | "Follow for one Python trick every day. You won't regret it." |
| "Let me know in the comments" | "Drop a 🔥 if this just saved you debugging time." |
| "Subscribe for more content" | "Part 2 drops Thursday — follow so you don't miss it." |
| "Hit the bell icon" | "What's your go-to Python shortcut? Tell me below." |

---

## 2. Hooks Longer Than 12 Words

**What it looks like:**
```
In this video I'm going to show you a really cool Python trick that most developers
don't know about that can save you a lot of time.
```
(26 words)

Or even:
```
Most Python developers are writing way more code than they need to for memoization.
```
(15 words — still too long)

**Why it happens:**
Natural speech patterns favor longer setup sentences. The hook feels more complete with context.

**Why it's harmful:**
- YouTube Shorts viewers scroll in under 2 seconds if the hook doesn't land
- A 15-word hook means the viewer has already scrolled before you reach the interesting part
- Long hooks often start with throat-clearing phrases ("In this video", "Today I want to show you") that actively signal "skip this"

**The rule:** Count the words. If the hook is over 12, cut it — not trim it. A shorter, less complete hook outperforms a longer, more complete one every time.

**Correction:**
```
Before: "Most Python developers are writing way more code than they need to for memoization."
After: "90% of Python devs write memoization from scratch. Stop."
```
(10 words — delivers the same message, creates a stronger knowledge gap)

---

## 3. Passive Voice in Scripts

**What it looks like:**
```
Time can be saved by using this decorator.
Memory is freed when the cache is cleared.
Bugs are eliminated by this pattern.
```

**Why it happens:**
Passive voice is grammatically comfortable in written technical content. It feels neutral and authoritative.

**Why it's harmful:**
- Passive voice is weak in spoken content — it drains energy from the delivery
- "Time can be saved" makes the viewer passive too — they're being told something might happen
- Active voice creates urgency: "This saves you time" vs "Time can be saved"
- YouTube Shorts rewards energy and directness — passive voice is the enemy of both

**The rule:** No passive voice in any sentence. Every sentence has a clear subject performing an action.

| Passive | Active |
|---------|--------|
| "Time can be saved by this decorator" | "This decorator saves you time" |
| "The bug was found by git bisect" | "git bisect finds the bug for you" |
| "Memory is freed when the session ends" | "Python frees the memory when your session ends" |
| "This is known as memoization" | "Developers call this memoization" |

---

## 4. Scripts That Require External Context

**What it looks like:**
A Short about a Python decorator starts with:
```
"As I showed in my last video, decorators work by wrapping functions..."
```
Or:
```
"If you've been following this series, you know we've been building a RAG pipeline..."
```

**Why it happens:**
The creator treats Shorts as episodes in a series. The script makes sense in the context of their channel.

**Why it's harmful:**
- The majority of YouTube Shorts viewers arrive from discovery (Shorts shelf, search) — not from subscriptions
- A viewer who has never seen the channel needs to understand the Short in full on first view
- "As I showed in my last video" is an immediate skip trigger for new viewers
- Self-contained content performs better in discovery because it doesn't require prior knowledge

**The rule:** Every Short must be fully self-contained. A viewer who has never seen the channel must be able to get full value from the Short on first view.

**Correction:**
Replace all external references with in-Short context:
```
Before: "As I showed last time, decorators wrap functions."
After: "Decorators in Python wrap a function — they run code before and after it executes."
```
One sentence of inline context is always better than a reference to content the viewer may not have seen.
