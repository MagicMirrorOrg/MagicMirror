---
name: devlog
description: Append a decision entry to DEVLOG.md capturing the rationale for a non-trivial change made this session.
---

# Devlog

Review the decisions made in the current session, then append ONE entry to the
top of `DEVLOG.md` at the repo root.

Rules:

- Capture WHY, not a diff. Rationale, rejected alternatives, consequences — never
  a restatement of the code changes or a commit list.
- If nothing decision-worthy happened this session, say so and write nothing.
- Use exactly this schema:

## YYYY-MM-DD — <short title>

**Context:** <the problem or situation that prompted this>
**Decision:** <what was chosen>
**Alternatives rejected:** <options considered and why not>
**Consequences:** <what this now requires or affects>
**Refs:** <commit SHAs / PR / files>

- After writing, show me the entry you added.
