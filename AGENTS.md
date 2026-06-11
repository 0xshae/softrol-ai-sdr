## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.Codex/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.Codex/skills/gstack
> cd ~/.Codex/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.Codex/skills/gstack/... for gstack file paths (the global path).

## Automatic Git sync

After successfully completing and verifying any task that changes code, tests,
configuration, or documentation, use the repo-local `auto-commit-sync` skill at
`.agents/skills/auto-commit-sync/SKILL.md`.

Commit only files and hunks created by the current task. Never include unrelated
or pre-existing user changes. Push the current branch to `origin` after the
commit succeeds. Skip this workflow for read-only tasks, incomplete or failing
work, or when the user explicitly asks not to commit or push.
