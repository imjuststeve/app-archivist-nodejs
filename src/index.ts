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
import { XyoOriginBlockLocalStorageRepository, XyoFileSystemStorageProvider, XyoDefaultPackerProvider, XyoSha256HashProvider } from "../../sdk-core-nodejs/dist/lib";

export async function startArchivist(port: number) {
  const packerProvider = new XyoDefaultPackerProvider();
  const packer = packerProvider.getXyoPacker();

  const originBlocksStorageProvider = new XyoFileSystemStorageProvider(
    `/Users/ryan/dev/projects/sdk-archivist-nodejs/data/${port}/origin-blocks`,
    'hex'
  );

  const originBlockNextHashStorageProvider = new XyoFileSystemStorageProvider(
    `/Users/ryan/dev/projects/sdk-archivist-nodejs/data/${port}/next-hash-index`,
    'hex'
  );

  const originChainStorageProvider = new XyoFileSystemStorageProvider(
    `/Users/ryan/dev/projects/sdk-archivist-nodejs/data/${port}/origin-chain`,
    'utf8'
  );

  const hashingProvider = new XyoSha256HashProvider();

  const originChainNavigator = new XyoOriginBlockLocalStorageRepository(
    packer,
    originBlocksStorageProvider,
    originBlockNextHashStorageProvider,
    hashingProvider
  );

  const archivistRepo = new XyoArchivistLocalStorageRepository(originChainNavigator, packer);
  await new GraphQLServer(archivistRepo, packer, hashingProvider).start();
}

if (require.main === module) {
  startArchivist(8088);
}
