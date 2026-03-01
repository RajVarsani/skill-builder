# Platform-Hosted Publishing via GitHub App

**Date:** 2026-03-01
**Status:** Approved

## Problem

The "Publish to Skill Builder" button (non-GitHub flow) is a stub — it returns a fake URL and doesn't actually push files anywhere. Users without GitHub connected have no working publish path.

## Solution

Use a GitHub App installed on the `skill-builder-agent` org to create and manage repos on behalf of users. Each user gets a repo: `skill-builder-agent/acting-as-{slug}`.

## Architecture

```
User clicks "Publish to Skill Builder"
  → POST /skills/conversations/:id/publish
  → github-publisher.ts
    ├── Has user's GitHub token? → publishToPersonalRepo() (existing)
    └── No token? → publishToOrgRepo() (NEW)
                      → Generate GitHub App installation token
                      → Create/update repo: skill-builder-agent/acting-as-{slug}
                      → Push SKILL.md + override files
                      → Return { repoUrl, installCommand }
```

## Auth: GitHub App

- App ID: stored in `GITHUB_APP_ID` env var
- Private key: stored as PEM file, path in `GITHUB_APP_PRIVATE_KEY_PATH`
- Installation ID: `GITHUB_APP_INSTALLATION_ID` (app installed on skill-builder-agent org)
- Uses `@octokit/auth-app` to generate short-lived installation access tokens per request
- Scoped permissions: `contents:write` + `administration:write`

## Env Vars

```
GITHUB_APP_ID=<app id>
GITHUB_APP_PRIVATE_KEY_PATH=<path to .pem file>
GITHUB_APP_INSTALLATION_ID=<installation id>
GITHUB_ORG_NAME=skill-builder-agent
```

## Changes

### 1. `github-publisher.ts`

- Add `publishToOrgRepo()` function
- Uses `@octokit/auth-app` to get installation token
- Creates repo under `skill-builder-agent` org if it doesn't exist
- Pushes files using GitHub Contents API (same as `publishToPersonalRepo`)
- Replace the current stub (lines 22-27) to call `publishToOrgRepo()`

### 2. `published-skill.ts` model

- Add optional `publishMethod: 'personal' | 'org'` field to track which path was used

### 3. No changes needed

- `skills.ts` route — already passes `user.githubAccessToken` (undefined for non-GitHub users)
- `PublishButtons.tsx` — "Publish to Skill Builder" button already triggers the right flow
- `ShareButtons.tsx` — works with any repo URL

## Install Command Format

- Personal GitHub: `skills install username/acting-as-username`
- Platform org: `skills install skill-builder-agent/acting-as-username`

Both are valid GitHub repo paths — the `skills install` CLI works identically for both.

## Dependencies

- `@octokit/auth-app` — npm package for GitHub App authentication
