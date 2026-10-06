---
name: security-review
description: Comprehensive security auditing, boundary enforcement, injection prevention, and credential hygiene checks
---

# Security Review Skill

Use this skill before opening pull requests or when reviewing code changes in elizaOS.

## Audit Checklist

1. **Authorization & Tenant Isolation**
   - Verify that all data accesses and mutations enforce tenant and user boundaries.
   - Ensure role checks and permission guards cannot be bypassed.

2. **Injection & Network Safety**
   - Check inputs against prompt injection and tool injection vulnerabilities.
   - Enforce SSRF guards on URL fetches and webhook registrations; verify domain allowlists.

3. **Secrets & Privacy**
   - Scan diffs for leaked API keys, tokens, hardcoded passwords, or PII.
   - Ensure secrets are omitted from logs, prompt contexts, error messages, and URLs.

4. **Effects & Approvals**
   - Ensure irreversible actions (financial transactions, external messaging, code execution) require explicit approval.
   - Verify durable effect receipts and idempotency key handling to prevent replay attacks.

5. **Resource Boundaries & Negative Tests**
   - Verify cancellation propagation under timeouts or abort signals.
   - Ensure negative test cases exist for malformed inputs, unauthorized calls, and rate limits.

Classify all findings strictly as **Blockers** (must fix before merge) or **Recommendations** (non-critical improvements).
