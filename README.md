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

## Contributing

This repository is for technical infrastructure changes only. For content contributions, see the main [kigwiki repository](https://github.com/kig-wiki/kigwiki).

## License

MIT License - same as the main Kig.wiki project.
