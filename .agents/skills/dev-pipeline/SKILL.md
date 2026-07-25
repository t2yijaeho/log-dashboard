---
name: dev-pipeline
description: Run this repository's Plan, Implement, Test, Review, and Release workflow for non-trivial features, fixes, refactors, security changes, or publication work. Use it when a change needs staged implementation, verification, review, remediation loops, or an explicitly authorized release.
---

# Development Pipeline

Read `AGENTS.md` and the files relevant to the task before delegating.

## Workflow

1. **Plan**
   - Use `dev-plan`.
   - Inspect the repository and produce a decision-complete plan.
   - If the user has not approved implementation, present the plan and stop.
2. **Implement**
   - Use `dev-implement` after approval.
   - Apply the smallest coherent change and add focused tests.
3. **Test**
   - Use `dev-test`.
   - Run lint, tests, build, and task-specific checks.
   - Return exact failures without editing tracked files.
4. **Review**
   - Use `dev-review` only after Test passes.
   - Review correctness, security, regressions, coverage, and scope.
5. **Release**
   - Use `dev-release` only after Review approves.
   - Re-run the gate, update release documentation, and perform only the
     Git/GitHub actions the user explicitly authorized.

## Remediation

When Test fails or Review requests changes, return every finding to
`dev-implement`, then repeat Test and Review. Stop after three remediation
rounds and request human direction instead of weakening a gate.

Do not parallelize agents that write to the same worktree. Read-heavy review
work may run in parallel only when the user explicitly requests delegation.
Never force-push, bypass verification, or infer permission to publish.
