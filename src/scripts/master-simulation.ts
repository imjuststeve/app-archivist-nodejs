/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 26th September 2018 1:51:12 pm
 * @Email:  developer@xyfindables.com
 * @Filename: master-simulation.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 27th September 2018 11:45:54 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */
import { promisify } from 'util';

import _ from 'lodash';
import path from 'path';
import fs from 'fs';

import {
  XyoLogger,
  XyoBoundWitness,
  XyoBoundWitnessPayloadProviderImpl,
  XyoEcSecp256kSignerProvider,
  XyoSha256HashProvider,
  XyoDefaultPackerProvider,
  XyoOriginChainLocalStorageRepository,
  XyoOriginBlockLocalStorageRepository,
  XyoBoundWitnessSuccessListener
} from 'xyo-sdk-core';

import { XyoArchivist } from './xyo-archivist';
import { XyoLevelDbStorageProvider } from '../leveldb-storage-provider/level-db-storage-provider';

const mkdir = promisify(fs.mkdir);
const logger = new XyoLogger();

if (require.main === module) {
  main();
}

async function main() {
  const hashProvider = new XyoSha256HashProvider();
  const signerProvider = new XyoEcSecp256kSignerProvider(hashProvider, 0x06, 0x01, 0x05, 0x01);
  const packer = new XyoDefaultPackerProvider().getXyoPacker();
  const dataPath = path.resolve('data');
  logger.info(dataPath);
  const startingPort = 9080;

  const ports = await Promise.all(_.times(5, async (index) => {
    const port = startingPort + index;
    const archivistDataPath = path.join(dataPath, String(port));
    await mkdir(archivistDataPath, null);
    const xyoSigner = signerProvider.newInstance();

    const originChainStorageProvider = new XyoLevelDbStorageProvider(
      path.join(archivistDataPath, `origin-chain`)
    );

    const originBlocksStorageProvider = new XyoLevelDbStorageProvider(
      path.join(archivistDataPath, `origin-blocks`)
    );

    const originBlockNextHashStorageProvider = new XyoLevelDbStorageProvider(
      path.join(archivistDataPath, `next-hash-index`)
    );

    const originBlockRepository = new XyoOriginBlockLocalStorageRepository(
      packer,
      originBlocksStorageProvider,
      originBlockNextHashStorageProvider,
      hashProvider
    );

    const originChainStateRepository = new XyoOriginChainLocalStorageRepository(originChainStorageProvider, packer);

    const boundWitnessSuccessListener: XyoBoundWitnessSuccessListener = {
      async onBoundWitnessSuccess(boundWitness: XyoBoundWitness): Promise<void> {
        logger.info(`Port ${port}: Bound Witness Success`);
      }
    };

    const archivist = new XyoArchivist(
      port,
      [xyoSigner],
      hashProvider,
      originChainStateRepository,
      originBlockRepository,
      boundWitnessSuccessListener
    );

    archivist.start();

    return port;
  }));

  // _.reduce(ports, (memo: Promise<XyoBoundWitness[]>, port: number) => {
  //   const boundWitnessPayloadProvider = new XyoBoundWitnessPayloadProviderImpl();
  //   return Promise.resolve([]); // todo
  // }, Promise.resolve([]) as Promise<XyoBoundWitness[]>);
}
