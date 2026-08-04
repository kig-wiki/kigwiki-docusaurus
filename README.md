# Kigwiki Docusaurus Repo

This repository contains the docusaurus config for [Kig.wiki](https://kig.wiki), as well as a docker-compose file to run the site locally.

Most contributors need not worry about this repository, unless you are seeking to make infrastructure changes or widespread site changes.

## Docusaurus howto

The official docs for docusaurus are [here](https://docusaurus.io/docs).

## Local Development

This infrastructure is designed to work with the content repository as a submodule:

```bash
# From the main kigwiki repository (not this one)
git submodule update --init --recursive
cd kigwiki-docusaurus
docker compose up --build
```

Docker mounts the **repository root** at `/repo` and runs the site from `/repo/kigwiki-docusaurus`, so the parent folders stay where Git expects them.

## Build Process

For production test builds (static output goes to `kigwiki-docusaurus/build/` on the host):

```bash
cd kigwiki-docusaurus
docker compose -f docker-compose-build.yml up --build
```

## Feedback form (Turnstile + Pages Function)

The `/feedback` page posts to a Cloudflare Pages Function at `functions/api/feedback.ts` in the **content** repo (`kigwiki`). Submissions are verified with [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/), then forwarded to a Discord webhook (name + message only; no IP logging).

### Build-time (public site key)

Set when building the Docusaurus site so the widget can render:

| Variable             | Cloudflare type            | Notes                                                                                                                        |
| -------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `TURNSTILE_SITE_KEY` | **Plain text** (build env) | Public widget site key. Wired via `customFields.turnstileSiteKey` in `docusaurus.config.ts`. Safe to expose in the built JS. |

Local Docker Compose sets Cloudflare’s **always-pass dummy** site key (`1x00000000000000000000AA`) automatically so the widget renders without your real production key. Dev mode also falls back to that dummy if the env var is unset.

Submitting still needs a running Pages Function + secrets; local UI-only testing does not require your real Turnstile keys.

### Runtime secrets (Pages Function)

Configure these as Cloudflare Pages **Encrypted secrets** for Production (and Preview if you test there). Never commit them.

| Variable               | Cloudflare type | Purpose                                                                                |
| ---------------------- | --------------- | -------------------------------------------------------------------------------------- |
| `TURNSTILE_SECRET_KEY` | **Secret**      | Turnstile siteverify secret (dummy always-pass: `1x0000000000000000000000000000000AA`) |
| `DISCORD_WEBHOOK_URL`  | **Secret**      | Discord incoming webhook URL for the feedback channel                                  |

In the Pages dashboard: **Settings → Environment variables** - use type **Text** for `TURNSTILE_SITE_KEY` (Build environment), and type **Secret** for the other two (Runtime / Production).

Create a Turnstile widget in the Cloudflare dashboard scoped to `kig.wiki` (and preview/localhost hostnames as needed). The free Turnstile plan is enough for this use case.

### CSP

`static/_headers` already allows `https://challenges.cloudflare.com` for Turnstile scripts/frames/connect.

## Contributing

This repository is for technical infrastructure changes only. For content contributions, see the main [kigwiki repository](https://github.com/kig-wiki/kigwiki).

## License

MIT License - same as the main Kig.wiki project.
