/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 26th September 2018 1:51:12 pm
 * @Email:  developer@xyfindables.com
 * @Filename: master-simulation.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 27th September 2018 4:22:18 pm
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
import { GraphQLServer } from '../graphql-api/server';
import { GraphqlSchemaBuilder } from '../graphql-api/graphql-schema-builder';
import { GetBlocksByPublicKeyResolver } from '../graphql-api/resolvers/get-blocks-by-public-key-resolver';
import { GetPayloadsFromBlockResolver } from '../graphql-api/resolvers/get-payloads-from-block-resolver';
import { GetPublicKeysFromBlockResolver } from '../graphql-api/resolvers/get-public-keys-from-block-resolver';
import { XyoArchivistLocalStorageRepository } from '../xyo-archivist-repository/xyo-archivist-local-storage-repository';

const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
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
  try {
    await stat(archivistDataPath);
  } catch (err) {
    if (err.code && err.code === 'ENOENT') {
      await mkdir(archivistDataPath, null);
    }
  }

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

  if ((await originChainStateRepository.getSigners()).length === 0) {
    originChainStateRepository.addSigner(signerProvider.newInstance());
  }

  const archivist = new XyoArchivist(
    port,
    await originChainStateRepository.getSigners(),
    hashProvider,
    originChainStateRepository,
    originBlockRepository,
    boundWitnessSuccessListener,
    packer
  );

  const archivistRepository = new XyoArchivistLocalStorageRepository(originBlockRepository, packer);

  const server = new GraphQLServer(
    new GraphqlSchemaBuilder().buildSchema(),
    new GetBlocksByPublicKeyResolver(archivistRepository, packer, hashProvider),
    new GetPayloadsFromBlockResolver(packer, hashProvider),
    new GetPublicKeysFromBlockResolver(packer, hashProvider),
    port + 1000
  ).start();

  archivist.start();
}
