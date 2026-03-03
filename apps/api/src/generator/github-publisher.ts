import { createAppAuth, type StrategyOptions } from '@octokit/auth-app'

interface PublishResult {
  repoUrl: string
  repoOwner: string
  installCommand: string
}

interface PublishFile {
  path: string
  content: string
  encoding?: 'base64'
}

interface PublishOptions {
  userName: string
  slug: string
  files: PublishFile[]
  githubAccessToken?: string
}

function decodePrivateKey(raw: string): string {
  if (raw.startsWith('-----BEGIN')) return raw
  return Buffer.from(raw, 'base64').toString('utf-8')
}

async function getInstallationToken(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID

  const missing = [
    !appId && 'GITHUB_APP_ID',
    !privateKeyRaw && 'GITHUB_APP_PRIVATE_KEY',
    !installationId && 'GITHUB_APP_INSTALLATION_ID',
  ].filter(Boolean)

  if (missing.length) {
    throw new Error(`GitHub App env vars missing: ${missing.join(', ')}`)
  }

  const privateKey = decodePrivateKey(privateKeyRaw!)
  const keyValid = privateKey.startsWith('-----BEGIN') && privateKey.includes('-----END')

  console.log(`[github] Auth config — appId=${appId}, installationId=${installationId}, keyLen=${privateKeyRaw!.length}, decodedLen=${privateKey.length}, keyValid=${keyValid}, keyStart=${privateKey.substring(0, 30)}`)

  if (!keyValid) {
    throw new Error(
      `GitHub App private key is malformed after decoding (len=${privateKey.length}, starts="${privateKey.substring(0, 20)}")`
    )
  }

  try {
    const auth = createAppAuth({
      appId: Number(appId),
      privateKey,
      installationId: Number(installationId),
    })

    const { token } = await auth({ type: 'installation' })
    console.log('[github] Installation token acquired')
    return token
  } catch (err: unknown) {
    const e = err as { status?: number; response?: { data?: unknown; url?: string } }
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[github] Token request failed:', {
      status: e.status,
      url: e.response?.url,
      data: e.response?.data,
      message: msg,
    })
    throw new Error(
      `GitHub App auth failed (HTTP ${e.status ?? '?'}): ${msg}`
    )
  }
}

export async function listAppInstallations(): Promise<unknown> {
  const appId = process.env.GITHUB_APP_ID
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY

  if (!appId || !privateKeyRaw) {
    return { error: 'Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY' }
  }

  const privateKey = decodePrivateKey(privateKeyRaw)
  console.log(`[github-debug] key len=${privateKeyRaw.length}, decoded len=${privateKey.length}, starts=${privateKey.substring(0, 27)}`)

  const auth = createAppAuth({ appId: Number(appId), privateKey } as StrategyOptions)
  const { token } = await auth({ type: 'app' })

  const res = await fetch('https://api.github.com/app/installations', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  const data = await res.json()

  // Also fetch the app info to get the slug
  const appRes = await fetch('https://api.github.com/app', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  const appData = await appRes.json() as { slug?: string; html_url?: string; name?: string }

  if (!res.ok) return { status: res.status, error: data }

  return {
    app: { slug: appData.slug, name: appData.name, installUrl: `https://github.com/apps/${appData.slug}/installations/new` },
    installations: (data as Array<{ id: number; account: { login: string }; target_type: string }>).map(
    (i) => ({ id: i.id, account: i.account?.login, targetType: i.target_type })
  ),
  }
}

async function findAvailableRepoName(
  baseName: string,
  orgName: string,
  token: string
): Promise<string> {
  const checkRes = await fetch(`https://api.github.com/repos/${orgName}/${baseName}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!checkRes.ok) return baseName

  // Repo exists — find a unique name with numeric suffix
  for (let i = 2; i <= 20; i++) {
    const candidate = `${baseName}-${i}`
    const res = await fetch(`https://api.github.com/repos/${orgName}/${candidate}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return candidate
  }
  // Fallback: append timestamp
  return `${baseName}-${Date.now()}`
}

async function publishToOrgRepo(
  repoName: string,
  files: PublishFile[]
): Promise<PublishResult> {
  const token = await getInstallationToken()
  const orgName = process.env.GITHUB_ORG_NAME || 'skill-builder-agent'

  // Always create a new repo — never overwrite an existing one
  const actualRepoName = await findAvailableRepoName(repoName, orgName, token)
  console.log(`[github] Publishing to org repo: ${orgName}/${actualRepoName} (${files.length} files)`)

  console.log(`[github] Creating ${orgName}/${actualRepoName}`)
  const createRes = await fetch(`https://api.github.com/orgs/${orgName}/repos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: actualRepoName,
      description: 'Professional identity skill generated by actingas.me',
      private: false,
      auto_init: true,
    }),
  })
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    console.error(`[github] Org repo creation failed: ${createRes.status}`, err)
    throw new Error(`Failed to create org repo: ${createRes.status} — ${JSON.stringify(err)}`)
  }
  console.log(`[github] Repo created, waiting for init`)
  await new Promise((r) => setTimeout(r, 2000))

  for (const file of files) {
    const existingRes = await fetch(
      `https://api.github.com/repos/${orgName}/${actualRepoName}/contents/${file.path}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const existing = existingRes.ok ? await existingRes.json() : null

    const putRes = await fetch(
      `https://api.github.com/repos/${orgName}/${actualRepoName}/contents/${file.path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update ${file.path}`,
          content: file.encoding === 'base64'
            ? file.content
            : Buffer.from(file.content, 'utf-8').toString('base64'),
          sha: existing?.sha,
        }),
      }
    )
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}))
      console.error(`[github] File push failed for ${file.path}: ${putRes.status}`, err)
    } else {
      console.log(`[github] Pushed ${file.path}`)
    }
  }

  console.log(`[github] Publish complete: ${orgName}/${actualRepoName}`)
  return {
    repoUrl: `https://github.com/${orgName}/${actualRepoName}`,
    repoOwner: orgName,
    installCommand: `npx skills install ${orgName}/${actualRepoName}`,
  }
}

export async function publishToGitHub(options: PublishOptions): Promise<PublishResult> {
  const { slug, files, githubAccessToken } = options
  const repoName = `acting-as-${slug}`

  if (githubAccessToken) {
    return publishToPersonalRepo(repoName, files, githubAccessToken)
  }

  return publishToOrgRepo(repoName, files)
}

async function findAvailablePersonalRepoName(
  baseName: string,
  owner: string,
  token: string
): Promise<string> {
  const checkRes = await fetch(`https://api.github.com/repos/${owner}/${baseName}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!checkRes.ok) return baseName

  for (let i = 2; i <= 20; i++) {
    const candidate = `${baseName}-${i}`
    const res = await fetch(`https://api.github.com/repos/${owner}/${candidate}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return candidate
  }
  return `${baseName}-${Date.now()}`
}

async function publishToPersonalRepo(
  repoName: string,
  files: PublishFile[],
  token: string
): Promise<PublishResult> {
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const user = await userRes.json()
  const owner = user.login

  // Always create a new repo — never overwrite an existing one
  const actualRepoName = await findAvailablePersonalRepoName(repoName, owner, token)

  const createRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: actualRepoName,
      description: `Professional identity skill generated by actingas.me`,
      private: false,
      auto_init: true,
    }),
  })
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    console.error('GitHub repo creation failed:', createRes.status, err)
    throw new Error(`Failed to create repo: ${createRes.status}`)
  }
  await new Promise((r) => setTimeout(r, 2000))

  for (const file of files) {
    const existingRes = await fetch(
      `https://api.github.com/repos/${owner}/${actualRepoName}/contents/${file.path}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const existing = existingRes.ok ? await existingRes.json() : null

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${actualRepoName}/contents/${file.path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update ${file.path}`,
          content: file.encoding === 'base64'
            ? file.content
            : Buffer.from(file.content, 'utf-8').toString('base64'),
          sha: existing?.sha,
        }),
      }
    )
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}))
      console.error(`GitHub file push failed for ${file.path}:`, putRes.status, err)
    }
  }

  return {
    repoUrl: `https://github.com/${owner}/${actualRepoName}`,
    repoOwner: owner,
    installCommand: `npx skills install ${owner}/${actualRepoName}`,
  }
}
