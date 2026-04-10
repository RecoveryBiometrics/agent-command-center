# CEO Digest Template

Only renders when warnings or errors exist. Silent on clean days.

```
*Ops Summary — {date}*

{status_emoji} *{business_name}*
  • {message_1}
  • {message_2}

{status_emoji} *{business_name_2}*
  • {message_1}
  • ...
```

## Status emojis
- All info → suppress entirely (don't post)
- Has warnings → use the warning emoji
- Has errors → use the red circle emoji

## Rules
- One section per business that has warnings/errors
- Skip businesses that are all clean
- Messages are pulled from #ops-log, filtered to non-info levels
- Keep under 1000 characters
- If ALL businesses are clean, output nothing (suppressed = true)
