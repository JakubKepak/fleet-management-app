# Pre-Commit Security Check

Scans staged files for exposed secrets and security issues before every commit.

## When to Use

This skill MUST be invoked automatically **before every git commit**. If you are about to create a commit, run this check first. Do NOT commit if any issues are found.

## Process

### 1. Scan Staged Files

Review all files staged for commit (`git diff --cached`) and check for:

**API Keys & Tokens:**
- Figma API keys (`figd_`)
- Google Maps API keys (`AIza`)
- Google AI / Gemini API keys
- GPS Dozor credentials (username/password in code, not in `.env`)
- Any string matching common key patterns: `sk-`, `pk_`, `token`, `secret`, `apikey`, `api_key`, `password`, `Bearer `

**Sensitive Files:**
- `.env` files (should be in `.gitignore`)
- `credentials.json`, `serviceAccount.json`
- Private keys (`*.pem`, `*.key`, `id_rsa`)
- Any file containing `BEGIN PRIVATE KEY` or `BEGIN RSA`

**Hardcoded Secrets in Code:**
- Base64-encoded credentials in source files
- Basic auth headers with plaintext credentials
- Connection strings with embedded passwords
- Inline tokens or keys in TypeScript/JavaScript files

### 2. Report Findings

If any issues are found:

1. **List each issue** with file path, line number, and what was detected
2. **Block the commit** — tell the user the commit cannot proceed
3. **Suggest fixes** — e.g., move to `.env`, add to `.gitignore`, use environment variables

If no issues found:

1. Confirm the scan passed
2. Proceed with the commit

### 3. Verify .gitignore

Before every commit, also verify that these entries exist in `.gitignore`:
- `.env`
- `.env.local`
- `.env.*.local`

### Patterns to Flag

```
# API key patterns (regex)
figd_[A-Za-z0-9_-]+          # Figma
AIza[A-Za-z0-9_-]{35}        # Google API
sk-[A-Za-z0-9]{20,}          # OpenAI / Stripe secret
pk_(test|live)_[A-Za-z0-9]+  # Stripe public
ghp_[A-Za-z0-9]{36}          # GitHub PAT
gho_[A-Za-z0-9]{36}          # GitHub OAuth
xoxb-[A-Za-z0-9-]+           # Slack bot token
xoxp-[A-Za-z0-9-]+           # Slack user token

# Generic patterns in source code (not .env or .env.example)
password\s*[:=]\s*['"][^'"]+['"]
api_?key\s*[:=]\s*['"][^'"]+['"]
secret\s*[:=]\s*['"][^'"]+['"]
token\s*[:=]\s*['"][^'"]+['"]
Authorization.*Bearer\s+[A-Za-z0-9._-]+
```

### What to Ignore

- `.env.example` files (these contain placeholder values, not real secrets)
- Environment variable **references** like `process.env.API_KEY` or `import.meta.env.VITE_API_KEY`
- Comments explaining what keys are needed
- Test fixtures with obviously fake values
