/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 10:03:36 am
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 24th September 2018 10:05:36 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { GraphQLServer } from "./graphql-api/server";
import { XyoArchivistLocalStorageRepository } from "./xyo-archivist-repository/xyo-archivist-local-storage-repository";

import {
  XyoOriginBlockLocalStorageRepository,
  XyoFileSystemStorageProvider,
  XyoDefaultPackerProvider,
  XyoSha256HashProvider
} from "../../sdk-core-nodejs";

import { GetBlocksResolver } from "./graphql-api/resolvers/get-blocks-resolver";
import { GraphqlSchemaBuilder } from "./graphql-api/graphql-schema-builder";
import path from 'path';

export async function startArchivist(dataDirectory: string) {
  const packerProvider = new XyoDefaultPackerProvider();
  const packer = packerProvider.getXyoPacker();

  const originBlocksStorageProvider = new XyoFileSystemStorageProvider(
    path.join(dataDirectory, `origin-blocks`),
    'hex'
  );

  const originBlockNextHashStorageProvider = new XyoFileSystemStorageProvider(
    path.join(dataDirectory, `next-hash-index`),
    'hex'
  );

  const hashingProvider = new XyoSha256HashProvider();

  const originChainNavigator = new XyoOriginBlockLocalStorageRepository(
    packer,
    originBlocksStorageProvider,
    originBlockNextHashStorageProvider,
    hashingProvider
  );

  const archivistRepository = new XyoArchivistLocalStorageRepository(originChainNavigator, packer);

  await new GraphQLServer(
    new GraphqlSchemaBuilder().buildSchema(),
    new GetBlocksResolver(archivistRepository, packer, hashingProvider)
  ).start();
}

if (require.main === module) {
  startArchivist(process.argv[2]);
}
