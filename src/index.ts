/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 10:03:36 am
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 4th October 2018 4:50:53 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { GraphQLServer } from "./graphql-api/server";
import { XyoArchivistLocalStorageRepository } from "./xyo-archivist-repository/xyo-archivist-local-storage-repository";

import {
  XyoOriginBlockLocalStorageRepository,
  XyoDefaultPackerProvider,
  XyoSha256HashProvider
} from "@xyo-network/sdk-core-nodejs";

import { GetBlocksByPublicKeyResolver } from "./graphql-api/resolvers/get-blocks-by-public-key-resolver";
import { GraphqlSchemaBuilder } from "./graphql-api/graphql-schema-builder";
import path from 'path';
import { GetPayloadsFromBlockResolver } from "./graphql-api/resolvers/get-payloads-from-block-resolver";
import { GetPublicKeysFromBlockResolver } from "./graphql-api/resolvers/get-public-keys-from-block-resolver";
import { XyoLevelDbStorageProvider } from "./leveldb-storage-provider/level-db-storage-provider";
import { GetAllBlocks } from "./graphql-api/resolvers/get-all-blocks-resolver";

export async function startArchivist(dataDirectory: string) {
  const packerProvider = new XyoDefaultPackerProvider();
  const packer = packerProvider.getXyoPacker();

  const originBlocksStorageProvider = new XyoLevelDbStorageProvider(
    path.join(dataDirectory, `origin-blocks`)
  );

  const originBlockNextHashStorageProvider = new XyoLevelDbStorageProvider(
    path.join(dataDirectory, `next-hash-index`)
  );

  const originBlockPublicKeyStorageProvider = new XyoLevelDbStorageProvider(
    path.join(dataDirectory, `public-key-index`)
  );

  const hashingProvider = new XyoSha256HashProvider();

  const originChainNavigator = new XyoOriginBlockLocalStorageRepository(
    packer,
    originBlocksStorageProvider,
    originBlockNextHashStorageProvider
  );

  const archivistRepository = new XyoArchivistLocalStorageRepository(
    originChainNavigator,
    packer,
    originBlockPublicKeyStorageProvider
  );

  await new GraphQLServer(
    await new GraphqlSchemaBuilder().buildSchema(),
    new GetBlocksByPublicKeyResolver(archivistRepository, packer, hashingProvider),
    new GetPayloadsFromBlockResolver(packer, hashingProvider),
    new GetPublicKeysFromBlockResolver(packer, hashingProvider),
    new GetAllBlocks(archivistRepository, packer, hashingProvider),
    4000
  ).start();
}

if (require.main === module) {
  startArchivist('/Users/ryan/dev/projects/sdk-archivist-nodejs/data/9080');
}
