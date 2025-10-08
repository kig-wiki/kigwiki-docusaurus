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
docker-compose up
```

The Docker setup will automatically mount the content directories (`docs/`, `makers/`, `hadatai/`, `static/`) from the parent repository.

## Build Process

For production test builds:

```bash
cd kigwiki-docusaurus
docker-compose -f docker-compose-build.yml up
```

This will copy all content files and build the static site in the `build/` directory.

## Contributing

This repository is for technical infrastructure changes only. For content contributions, see the main [kigwiki repository](https://github.com/kig-wiki/kigwiki).

## License

MIT License - same as the main Kig.wiki project.
