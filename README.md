[logo]: https://www.xy.company/img/home/logo_xy.png

![logo]

[![Build Status](https://travis-ci.com/XYOracleNetwork/app-archivist-nodejs.svg?branch=develop)](https://travis-ci.com/XYOracleNetwork/app-archivist-nodejs)

# Archivist

A command line interface application to run an XYO Archivist node.

An archivist in the XYO network serves as the data-layer component between the bridge and the diviner.
It accepts and aggregates data from bridges and makes that data available to Diviners via a GraphQL API.

As long as an archivist follows the protocols of the XYO network specified in the [yellow paper](https://docs.xyo.network/XYO-Yellow-Paper.pdf)
they may implement the component however they wish. This application supports using MySQL as the persistence engine that
backs the archivist repository, LevelDb to persist origin-chain data specific to this node, and TCP as the transport
layer for doing bound-witness interactions between the Archivist and other Bridges.

# Getting Started

## Install

Before downloading the application, there are number of System requirements that will need to be satisfied.

- [NodeJS](https://nodejs.org/en/) The application is built using NodeJS. Internally we've tested against version 10.13.0. Consider using [nvm](https://github.com/creationix/nvm) to satisfy this dependency. Among other benefits, it may save you the trouble of using `sudo` in upcoming commands.

- [MySQL](https://dev.mysql.com/downloads/mysql/5.7.html#downloads) A MySQL service is currently require to meet the Archivist feature set. This will likely change in the future and there will be support for a number of different database providers. At the moment though a MySQL service dependency will need to be satisfied for the archivist to run properly. Internally we've tested against version 5.7.24

Download as a global npm package. We

```sh
  npm install -g @xyo-network/app-archivist-nodejs
```

If this command fails you may need to use the `sudo` modifier.

```sh
  sudo npm install -g @xyo-network/app-archivist-nodejs
```

If this fails again it it likely because the LevelDB dependency is being built from source in protected user-space on the System OS. To get around this the npm option of `--unsafe-perm=true` may be used.

```sh
  sudo npm install -g @xyo-network/app-archivist-nodejs --unsafe-perm=true
```

Assuming one of the above 3 commands succeed, you now have a downloaded version of the archivist on your system. To confirm run

```sh
which xyo-archivist
```

It should print something that approximates `/usr/local/bin/xyo-archivist`. If nothing is printed out you may have to close and reopen your terminal window.

## Running the Application

Now that the software is installed we need to make sure that our SQL service is in the correct state for the application. Please refer to the documentation in [db-archivist-sql](https://github.com/XYOracleNetwork/db-archivist-sql/tree/develop) to get your MySQL service set up.

Once the MySQL service is available with the correct schema please note the values for your MySQL service.

- host
- port
- user
- password
- database

The application can then be started passing these arguments to application.

```sh
  SQL__HOST={host} \
  SQL__PORT={port} \
  SQL__USER={user} \
  SQL__PASSWORD={password} \
  SQL__DATABASE={database} \
  xyo-archivist
```

For example,

```sh
  SQL__HOST=127.0.0.1 \
  SQL__PORT=3306 \
  SQL__USER=ryan \
  SQL__PASSWORD=password \
  SQL__DATABASE=Xyo \
  xyo-archivist
```

A number of things should happen at this point. You should see a number of logs come up on the screen informing you that you've created and origin chain and other log statements displaying the output of a number of SQL logs. This is good. If the application is stopped you'll notice two folders in the directory that you started the application in.

- `archivist-db` This folder contains the data relevant to origin chain owner of this archive. It is very important as it contains private/public key pairs which make it possible to create new blocks on the origin chain. DO NOT DELETE OR SHARE THIS FOLDER

- `logs` Logs relating to the routines of the application. These will be deleted every 14 days

** Happy Archiving **

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