[logo]: https://www.xy.company/img/home/logo_xy.png

![logo]

# DB Archivist SQL

This package implements the `ArchivistRepository` interface defined in [xyo-network/sdk-archivist-nodejs](https://github.com/XYOracleNetwork/sdk-archivist-nodejs). It uses MySQL as the database engine. The schema for the database can be found at [resources/schema.sql](resources/schema.sql). The current implementation has only been tested against MySQL version 5.7.24 but with a bit of effort the schema and routines could be adjusted to work for most SQL engines.

## Getting started

### Clone repository

```sh
git clone https://github.com/XYOracleNetwork/db-archivist-sql.git
```

### Install dependencies

After cloning the repository, change directory to the folder that houses the repository.

```sh
  cd db-archivist-sql
```

Once you've switched to the repository directory, install the dependencies. We prefer `yarn` but `npm` works just as well.

```sh
  yarn install
```

## Testing

There is a single end-to-end test in the repository [data.spec.ts](src/spec/data.spec.ts). This test is dependent on a MySQL service set to the schema [resources/schema.sql](resources/schema.sql). The default MySQL connection details can be override using environment variables:

* SQL__HOST
* SQL__USER
* SQL__PASSWORD
* SQL__DATABASE
* SQL__PORT

To run the test:

```sh
yarn test
```

## Developer Guide

Developers should conform to git flow workflow. Additionally, we should try to make sure
every commit builds. Commit messages should be meaningful serve as a meta history for the
repository. Please squash meaningless commits before submitting a pull-request.

There is git hook on commits to validate the project builds. If you'd like to commit your changes
while developing locally and want to skip this step you can use the `--no-verify` commit option.

i.e.

```sh
  git commit --no-verify -m "COMMIT MSG"
```

## License

Only for internal XY Company use at this time

## Credits

Made with ❤️
by [XYO](https://xyo.network)