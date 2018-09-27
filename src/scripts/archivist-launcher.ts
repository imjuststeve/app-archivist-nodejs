/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 26th September 2018 1:51:12 pm
 * @Email:  developer@xyfindables.com
 * @Filename: master-simulation.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 27th September 2018 1:47:30 pm
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
  XyoEcSecp256kSignerProvider,
  XyoSha256HashProvider,
  XyoDefaultPackerProvider,
  XyoOriginChainLocalStorageRepository,
  XyoOriginBlockLocalStorageRepository,
  XyoBoundWitnessSuccessListener,
  XyoSignerProvider,
  XyoPacker,
  XyoHashProvider
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

  const ports = await Promise.all(_.times(1, async (index) => {
    const port = startingPort + index;
    await createArchivist(port, packer, hashProvider, dataPath, signerProvider);
    return port;
  }));
}

async function createArchivist(
  port: number,
  packer: XyoPacker,
  hashProvider: XyoHashProvider,
  dataPath: string,
  signerProvider: XyoSignerProvider
) {
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
      logger.info(`Port ${port}: Bound Witness Success. Resting 5 sec`);

      const publicKeys = boundWitness.publicKeys.map((publicKeySet) => {
        return publicKeySet.array.map((publicKey) => {
          return packer.serialize(publicKey, publicKey.major, publicKey.minor, true).toString('hex');
        });
      });

      const signatures = boundWitness.signatures.map((signatureSet) => {
        return signatureSet.array.map((signature) => {
          return packer.serialize(signature, signature.major, signature.minor, true).toString('hex');
        });
      });

      const signedPayloads = boundWitness.payloads.map((payloads) => {
        return payloads.signedPayload.array.map((signedPayload) => {
          return packer.serialize(signedPayload, signedPayload.major, signedPayload.minor, true).toString('hex');
        });
      });

      const unsignedPayloads = boundWitness.payloads.map((payloads) => {
        return payloads.unsignedPayload.array.map((unsignedPayload) => {
          return packer.serialize(unsignedPayload, unsignedPayload.major, unsignedPayload.minor, true).toString('hex');
        });
      });

      const hash = await boundWitness.getHash(hashProvider);

      const digest = JSON.stringify({
        publicKeys,
        signatures,
        signedPayloads,
        unsignedPayloads,
        hash: packer.serialize(hash, hash.major, hash.minor, true).toString('hex')
      }, null, '\t');

      logger.info(digest);

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          logger.info(`Port ${port}: Coming back up to speed`);
          resolve();
        }, 5000);
      }) as Promise<void>;
    }
  };

  const archivist = new XyoArchivist(
    port,
    [xyoSigner],
    hashProvider,
    originChainStateRepository,
    originBlockRepository,
    boundWitnessSuccessListener,
    packer
  );

  archivist.start();
}
