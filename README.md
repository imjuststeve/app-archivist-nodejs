[logo]: https://www.xy.company/img/home/logo_xy.png

![logo]

# Archivist

This repository generally serves to aggregate archivist-related NodeJS modules in the XYO network. It is structured as a [Lerna](https://lernajs.io/) mono-repo wherein the packages inside the `packages` directory are modules in themselves and are distributed as such through `npm`.

An archivist in the XYO network serves as the data-layer component between the bridge and the diviner.
It accepts and aggregates data from bridges and makes that data available to Diviners via a GraphQL API.

As long as an archivist follows the protocols of the XYO network specified in the [yellow paper](https://docs.xyo.network/XYO-Yellow-Paper.pdf)
they may implement the component however they wish. This application supports using MySQL as the persistence engine that
backs the archivist repository, LevelDb to persist origin-chain data specific to this node, and TCP as the transport
layer for doing bound-witness interactions between the Archivist and other Bridges.

# Getting Started

## Docker

Perhaps the easiest way to get up and going is with docker.

First, satisfy the MySQL requirement:

```sh
  docker run \
  -d \
  -p 3306:3306 \
  -e MYSQL_USER={user} \
  -e MYSQL_PASSWORD={password} \
  -e MYSQL_DATABASE={database} \
  -e MYSQL_RANDOM_ROOT_PASSWORD=yes \
  mysql:5.7.24 --sql_mode=NO_ENGINE_SUBSTITUTION

```

**NOTE** Please substitute variable `{user}` `{password}` and `{database}` with your own values.

When the docker command is executed it will return a docker-container id. To get the ip address of the docker container you can run:

```sh
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' {docker-container-id}
```

Take note of the ip address as this will be required configure the Archivist application.

```sh
  docker run \
  -d \
  -p 11000:11000 \
  -p 11001:11001 \
  -v {path-to-logs-folder}:/workspace/logs \
  -v {path-to-private-data-folder}:/workspace/archivist-db \
  -e NODE_NAME={archivist-name} \
  -e IP_OVERRIDE={publicly-accessible-ip} \
  -e SQL__HOST={ip-address-of-mysql-service} \
  -e SQL__USER={user-of-mysql-service} \
  -e SQL__PASSWORD={name-of-user-on-mysql-service} \
  -e SQL__DATABASE={name-of-database-on-mysql-service} \
  -e SQL__PORT={port-of-database-on-mysql-service} \
  xyonetwork/app-archivist:latest
```

List of parameters:

- `-d` run docker as daemon

- `-p 11000:11000` bind port 11000 from docker container to local network

- `-p 11001:11001` bind port 11001 from docker container to local network

- `-v {path-to-logs-folder}:/workspace/logs` Mount **logs** folder from local disk to docker container

- `-v {path-to-private-data-folder}:/workspace/archivist-db` Mount **private-data** folder from local disk to docker container

- `-e NODE_NAME={archivist-name}` The name of the archivist

- `-e IP_OVERRIDE={publicly-accessible-ip}` The publicly addressable ip address of this Archivist

- `-e SQL__*` SQL configuration settings

- `xyonetwork/app-archivist:latest` Run the latest archivist image from docker-hub.


## Install

Before downloading the application, there are number of System requirements that will need to be satisfied.

- [NodeJS](https://nodejs.org/en/) The application is built using NodeJS. Internally we've tested against version 10.13.0. Consider using [nvm](https://github.com/creationix/nvm) to satisfy this dependency. Among other benefits, it may save you the trouble of using `sudo` in upcoming commands.

- [MySQL](https://dev.mysql.com/downloads/mysql/5.7.html#downloads) A MySQL service is currently require to meet the Archivist feature set. This will likely change in the future and there will be support for a number of different database providers. At the moment though a MySQL service dependency will need to be satisfied for the archivist to run properly. Internally we've tested against version 5.7.24

Download as a global npm package. We

```sh
  npm install -g @xyo-network/app-archivist
```

If this command fails you may need to use the `sudo` modifier.

```sh
  sudo npm install -g @xyo-network/app-archivist
```

If this fails again it it likely because the LevelDB dependency is being built from source in protected user-space on the System OS. To get around this the npm option of `--unsafe-perm=true` may be used.

```sh
  sudo npm install -g @xyo-network/app-archivist --unsafe-perm=true
```

Assuming one of the above 3 commands succeed, you now have a downloaded version of the archivist on your system. To confirm run

```sh
which xyo-archivist
```

It should print something that approximates `/usr/local/bin/xyo-archivist`. If nothing is printed out you may have to close and reopen your terminal window.

## Running the Application

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

<p align="center">Made with  ❤️  by [<b>XY - The Persistent Company</b>] (https://xy.company)</p>
