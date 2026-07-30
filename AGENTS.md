# Palace

A suite of family tools.

## Unfinished

- Most features are unfinished.
- This is a greenfield project. Backwards-compatibility is an anti-pattern. Do not avoid breaking changes, e.g. prefer just renaming a symbol over making an alias to avoid renaming.
- This will be used for multiple site instances in future but for now there are lots of hard-coded instance-specific things around: users, roles, etc. These will be removed but leave them alone for now unless the user explicitly indicates to parameterize.
- Example: there is not yet any actual authentication. This is unnecessary at this point.
- This relies on three other sibling workspaces, assume they are present and feel free to read them. Don't edit them unless the user explicitly requests it.
  - `toolkit`
  - `route`
  - `outlaw`
