---
name: auto-commit-sync
description: Create clean, atomic Git commits for changes made by the current coding task and push them to GitHub. Use after an agent successfully completes and verifies any code, test, configuration, or documentation change in this repository, or when the user asks to commit, ship, save, or sync changes. Do not use for read-only tasks, failed work, work in progress, or when the user explicitly asks not to commit or push.
---

# Auto Commit Sync

Commit only the current task's verified changes. Preserve unrelated user work, produce concise conventional commit messages, and push the checked-out branch to `origin`.

## 1. Inspect

1. Run `git status --short --branch`.
2. Inspect `git diff`, `git diff --cached`, and relevant untracked files.
3. Identify exactly which files were created or modified by the current task.
4. Exclude unrelated edits, generated artifacts, secrets, local environment files, and changes whose ownership is uncertain.
5. If unrelated changes overlap a task-owned file and cannot be separated safely, stop and explain the conflict instead of committing.

Never use `git add .`, `git add -A`, or a similarly broad staging command.

## 2. Verify

Confirm the task's relevant tests, checks, or build have passed before committing. Do not commit when verification failed, a required check was not run, or the task is incomplete. Report the blocker instead.

## 3. Group And Stage

Split the task-owned diff into the smallest logical groups that remain independently coherent. For each group:

1. Stage explicit paths with `git add -- <path>...`.
2. For mixed files, use a non-interactive patch or path-limited technique that stages only the intended hunks.
3. Review the staged result with `git diff --cached --stat` and `git diff --cached`.
4. Confirm no pre-existing or unrelated staged changes are included.

Do not modify, discard, stash, or reset unrelated user changes.

## 4. Commit

Create one commit per logical group:

```bash
git commit -m "<type>: <imperative description>"
```

Use a lowercase conventional type such as `feat`, `fix`, `refactor`, `test`, `docs`, `build`, or `chore`. Start the description with an imperative verb, keep the subject concise, and describe the user-visible intent rather than the editing mechanics.

Examples:

- `feat: add x402 challenge handling`
- `fix: prevent duplicate lead enrichment`
- `docs: explain local webhook setup`

If a commit hook fails, fix the task-owned issue and retry. Never bypass hooks unless the user explicitly authorizes it.

## 5. Check And Sync

1. Run `git status --short --branch`.
2. Confirm no task-owned changes remain uncommitted and no unintended files are staged.
3. Confirm HEAD is attached to a named branch and `origin` points to the expected repository.
4. Push the current branch:

```bash
git push origin HEAD
```

Use `git push -u origin HEAD` only when the branch has no upstream. Never force-push. Stop and report authentication failures, rejected pushes, conflicts, detached HEAD, or an unexpected remote.

## 6. Report

Tell the user which commits were created, which branch was pushed, and whether unrelated local changes remain. Say "shipped" only after the push succeeds.
