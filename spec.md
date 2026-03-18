# BandSpace

## Current State
The backend `main.mo` was truncated and missing all post, follow, notification, search, and moderation methods. Critically, no data variables were declared as `stable`, causing data wipe on every deployment.

## Requested Changes (Diff)

### Add
- Complete rewrite of `main.mo` with ALL methods restored
- `stable` keyword on all persistent data vars
- `preupgrade`/`postupgrade` system hooks
- Safe `normalizeWebsite` helper (no pipe operator)

### Modify
- All `var` declarations changed to `stable var`

### Remove
- Truncated/incomplete backend code
- Pipe operator syntax that caused compile failures

## Implementation Plan
1. Write complete `main.mo` with stable vars, upgrade hooks, and all methods
2. Fix any syntax issues (normalizeWebsite, unused variables)
3. Deploy
