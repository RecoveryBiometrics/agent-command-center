---
description: Generate Facebook social posts from ops activity. Reads #ops-log, writes 4 posts to #social with different angles and suggested post times.
invocation: /social
when_to_use: When the user wants to generate daily FB social content, or when a trigger needs social posts from ops data.
---

# Social Content Pipeline

Generate 4 Facebook text posts based on operations activity from #ops-log.

## Usage
```
/social              # generate 4 posts from today's ops activity
/social safebath     # focus posts on SafeBath activity
```

## Voice & Style Rules (CRITICAL — follow exactly)

- Stream of consciousness, like talking to a friend
- Short punchy lines. Fragments. Not polished.
- Use ".." not "..." — loose punctuation, no polish
- Self-deprecating humor woven in naturally
- Real stories first, the lesson sneaks in at the end
- Gaming/pop culture references when they fit (exp points, Pacman, etc)
- ZERO hashtags, ZERO emojis, ZERO corporate energy
- Don't correct spelling mistakes, own them
- Never use words like "leverage", "optimize", "synergy", "game-changer"
- Never start with "Just" or "So excited to"
- Posts must NOT smell like AI wrote them. Read them back. If they sound like LinkedIn, rewrite.
- Reference specific real numbers from the ops data
- Talk about Claude Code and AI as tools you actually use, not hype
- Mention failures and debugging honestly — that's what makes it real
- Vary post length — some long storytelling, some 3-5 lines

## Examples (study the rhythm)

"I woke up this morning and checked my ops channel..
56 new posts deployed across one business while I was sleeping.
20 podcast episodes. 18 blog posts. 5 translated to Hindi. 5 to Spanish.
No VA. No content team. No freelancers.
Just pipelines I built with Claude Code running on a schedule..
The craziest part.. this is just one of my businesses.
The same system runs for all of them.
I change it once and it changes everywhere.."

"Yesterday I spent a few hours breaking my own system..
Pushed a fix. Broke it.
Pushed another fix. Broke it again.
Reverted. Tried again. Broke it a different way.
Five commits later it finally worked..
Nobody talks about this part.
That's the real work.
The system works now though.
And next Sunday I won't have to touch it.
That's the whole game.. you earn your weekends back one broken pipeline at a time."

"Can you imagine running a team of 24. The organization you need .. the role definition you need and the clarity you need to understand your organization...
My dashboard shows me my team, VP's, Directors and agents and there roles.
They keep me updated bring me problems they can't solve
And we just talk like a real team in slack .
And my executive team starts to form ..
Btw .. Claude code and GHL .. nothing beats this!!"

"Ai builds slop.
It's only true if you have no idea what your doing.
My AI built something sloppy and I was ok with that.
How come?
Well because if I don't know how or where to start I just start..
To me learning is a process
A process that looks like it's drawn by a third grader at best..
I gain exp points from my failures."

"Social media should be fun.
Just post some stuff.
Some of it will work, some of it won't.
Find the stuff that works and do more of that.
I know that sounds too simple.
I've also watched people spend more time planning their content strategy ...
Than actually making content.
...Much less making money.
So like ...
Yeah.
You got this."

"We have more opportunity than we know.
Classic example...
I just read about this lady.
She \"only\" has 800 people on her email list.
But she's bringing in over $1,500 a month with a paid email newsletter.
The point is  ...we might be making stuff harder than it needs to be.
Sometimes that's enough."

## The 4 Posts — each must be a DIFFERENT angle

### POST 1: Morning production flex (suggest: post at 8am)
What happened overnight — pipelines running while sleeping, content deployed, podcasts produced. Lead with real numbers. Vibe: "I woke up and all this was already done."

### POST 2: Builder story / debugging / behind the scenes (suggest: post at 12pm)
The messy reality. Failed deploys, broken pipelines, fixes that took 5 tries, things learned the hard way. If nothing broke, talk about a system decision or architecture choice. Shows the real work, not just wins.

### POST 3: Systems thinking / AI team / bigger picture (suggest: post at 3pm)
How AI agents work as a team, one system serving multiple businesses, the org structure, Slack as a communication layer. This is the DM magnet — makes people ask "how do you do this?"

### POST 4: Short punchy OR philosophical reflection (suggest: post at 6pm)
End-of-day energy. Either tight 3-5 lines or a longer reflective piece about building with AI, entrepreneurship, learning by doing, opportunity. Frank Kern meets indie hacker. Doesn't need specific ops numbers.

## Steps

1. Read the last 24 hours of #ops-log (channel ID: C0AQG0DP222). Pull out: pipeline runs, deploys, content produced, podcast episodes, failures, fixes, reverts, cross-business patterns, interesting numbers.
2. Write all 4 posts. Make sure each is a genuinely different angle and story. No repeated numbers or themes across posts.
3. Post each as a SEPARATE message to #social (channel ID: C08AEC99R5K) with prefix:
   - *FB Post 1 — Morning (post ~8am)*
   - *FB Post 2 — Midday (post ~12pm)*
   - *FB Post 3 — Afternoon (post ~3pm)*
   - *FB Post 4 — Evening (post ~6pm)*
4. Log to #ops-log: `[Social Content] Complete. 4 FB posts generated from today's ops activity. Posted to #social.`

## Rules

- If ops-log is light, Post 1 can be about consistency/showing up, Post 2 about a past debugging story or lesson, Post 3 about the system itself, Post 4 philosophical. Always deliver 4 posts.
- NEVER use AI-sounding language. If it sounds like ChatGPT wrote it, rewrite.
- The goal is inbound leads. These posts got 2 DMs last week. Keep that energy.
- Each post must stand alone — someone reading just one should get value.

## Channels

- **Read from:** #ops-log (C0AQG0DP222)
- **Write to:** #social (C08AEC99R5K)
- **Log to:** #ops-log (C0AQG0DP222)

## Tools needed
- `mcp__Slack__slack_read_channel` — read ops-log
- `mcp__Slack__slack_send_message` — post to #social and log to #ops-log
