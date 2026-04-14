---
name: Don't use mermaid in Notion
description: Mermaid diagrams render too small in Notion to be readable. Don't propose them as visualization.
type: feedback
originSessionId: a406e05f-429c-4b08-b1d1-b96571eb04aa
---
Mermaid in Notion renders at a tiny fixed size — unreadable for anything beyond a 5-node diagram. User has explicitly rejected this approach multiple times.

**Why:** Wasted significant time across one session iterating on mermaid diagrams the user couldn't read. Tested 3 versions (single dense, 8 small subgraphs, simplified LR). All failed the readability bar.

**How to apply:**
- For org/system maps in Notion → use linked databases with Board views (group by Status, Type, Stage), NOT mermaid
- For interactive workflow visualization → recommend n8n / Whimsical / Eraser, NOT mermaid in Notion
- Mermaid is fine in chat output and in code repos / GitHub READMEs. Just not in Notion as a "look at this org chart" deliverable.
