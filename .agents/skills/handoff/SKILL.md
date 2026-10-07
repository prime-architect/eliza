---
name: handoff
description: Checkpointing development sessions, active state, verified results, and resumption instructions
---

# Session Handoff Skill

Use this skill when pausing work, ending a development session, or handing off state between agents or engineers.

## Handoff Template

Generate a structured status summary recording:

1. **Target Goal & Context**
   - Active feature or bugfix description.
   - Current Git branch and base commit SHA.

2. **Working State & Modifications**
   - Exact list of modified, created, or deleted files (`git status --short`).
   - Architectural decisions or deviations made during the session.

3. **Validation & Verification Evidence**
   - Commands executed and their exact exit codes.
   - Verified results, failing tests, or known environment bottlenecks.
   - *Never claim an unexecuted, queued, or partial check passed.*

4. **Pending Steps & Resumption**
   - Explicit next steps to continue implementation.
   - Exact next command line to execute.
