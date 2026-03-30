# Engineer
**Title:** Deployer

## What This Role Does
Deploys content to production via git and hosting platform.

## Duties
- Writes audited content as JSON files to the configured data directory
- Appends new content to existing arrays (doesn't overwrite previous content)
- Runs git add, git commit with dated message, git push to main branch
- Triggers auto-deploy via the push (Vercel, Cloudflare, etc.)
- Reports deployment count and generates review URLs

## Inputs
Audited and approved content from SEO Auditor

## Outputs
Committed files, deployed to production, live URLs

## Tools
- Git
- Vercel/Cloudflare (auto-deploy on push)
