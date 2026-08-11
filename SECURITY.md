# Security Policy

## Reporting a vulnerability

Report privately through GitHub's private vulnerability reporting, which is enabled on this repository:

**[Open a draft security advisory](https://github.com/codefastlabs/codefast/security/advisories/new)**

Please do **not** open a public issue, discussion, or pull request for a vulnerability.

Useful things to include: the affected package and version, whether it reproduces on the `canary` channel, and a minimal
proof of concept. If the issue is in a dependency rather than in `@codefast/*` code, say so — those are usually handled
by Dependabot and may already be in flight.

This is a small project without a staffed security rotation, so reports are handled on a best-effort basis rather than
against a fixed response time. You will get an acknowledgement when the report is read, a decision once it has been
assessed, and credit in the advisory unless you ask to remain anonymous.

## Supported versions

All `@codefast/*` packages version together as one group, so a fix ships across the whole group at once. The project is
**pre-1.0**: fixes land on the `canary` channel first, and that is the channel the documentation site tracks.

| Channel / line                           | Supported                                                            |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `canary` — `0.5.0-canary.x`              | :white_check_mark: fixes land here first                             |
| `latest` — `0.4.0`                       | :white_check_mark: patched when a fix is not tied to unreleased work |
| `1.0.0-canary.6/.7`, `1.0.1-canary.2/.3` | :x: published in error, abandoned — see below                        |
| Everything below `0.4.0`                 | :x:                                                                  |

`@codefast/tracking` has no stable release yet; only its `canary` builds are supported.

Because breaking changes still ship between canaries before 1.0, the practical advice for a security fix is to move to
the current `canary` rather than to expect a backport to an older line.

### The stray `1.x` line

Four `1.x` prereleases (`1.0.0-canary.6`, `1.0.0-canary.7`, `1.0.1-canary.2`, `1.0.1-canary.3`) were published by an
accidental major bump and remain on npm. They are **not** a newer or more complete version of the library — the release
line was reset back to `0.5.0-canary.x`, which is where all subsequent work went.

They sort **above** the current release in semver, so a range like `^1` can silently pin you to an abandoned build that
will never receive a fix. If you are on one of them, move back to the published release line:

```bash
pnpm add @codefast/ui@latest
```

## Reporting something that is not a vulnerability

A crash, a wrong render, or a regression with no security impact belongs in a
[normal issue](https://github.com/codefastlabs/codefast/issues/new/choose).
