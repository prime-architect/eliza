---
name: nararouter-coding
description: Delegated OpenAI-compatible inference helper via NaraRouter (https://router.bynara.id/v1) for scoped coding and reasoning tasks
---

# NaraRouter Delegated Coding Skill

Use this skill to delegate specific, narrowly scoped coding, review, or debugging queries to models hosted via NaraRouter.

## Operation Principles

1. **Environment Key Requirement**
   - Requires `NARAROUTER_API_KEY` set in the environment.
   - Never print, log, or commit the API key.

2. **Scoped Context**
   - Transmit only files explicitly selected for the immediate task. Never send the entire repository tree.

3. **Escalation Ladder & Cost Controls**
   - Default tier: `free_coding` (`stealth/space-bunny-alpha` or verified free alias) with `reasoning_effort: low`.
   - Never switch into a paid tier (`fallback_coding`, `strong_paid`) without explicit user cost approval.
   - Fail closed immediately on HTTP `401`, `403`, `429`, or unverified model IDs.

4. **Execution Command**
   ```bash
   node .agents/skills/nararouter-coding/scripts/client.mjs --profile <profile> --prompt "<prompt>" [--files <file1> <file2>]
   ```
