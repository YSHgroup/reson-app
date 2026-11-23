# Agent rules

- Keep changes focused. Do not modify the untracked `reference/` directory.
- For each distinct implementation, create a focused branch from `main`, validate
  the change, commit it, and merge the finished branch into `main`.
- Do not push branches or commits unless explicitly asked.
- Preserve ResonApp's existing routes, MongoDB data, and chat service unless a
  migration or replacement is explicitly approved.
- Never commit credentials, private keys, or local environment values.
- Run the narrowest relevant lint, test, or build checks and report failures.
