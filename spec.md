# BandSpace

## Current State
The backend has stable variables for UserProfile, ArtistPage, Post, and Notification. There are no preupgrade/postupgrade hooks. All record fields in stored types are required (non-optional), which causes deserialization failures on every canister upgrade that adds new fields.

## Requested Changes (Diff)

### Add
- `preupgrade` system function to snapshot stable data before upgrade
- `postupgrade` system function to migrate/backfill data after upgrade
- Version tracking variable to support future migrations

### Modify
- All stored record types (`UserProfile`, `ArtistPage`, `Post`, `Notification`) to use a safe upgrade-compatible pattern
- Stable variable declarations to use upgrade-safe serialization approach

### Remove
- Nothing removed

## Implementation Plan
1. Add a stable `version` Nat variable for future migration versioning
2. Add `preupgrade` and `postupgrade` system functions
3. In `postupgrade`, iterate over stored records and backfill any missing optional fields with defaults
4. Ensure all currently required fields that were added in recent deployments (`ArtistPage.username`, `Post.authorIdentity`) are handled safely in migration
5. Document the pattern so all future field additions follow the optional-field rule
