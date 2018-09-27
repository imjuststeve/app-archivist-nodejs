/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 27th September 2018 1:04:07 pm
 * @Email:  developer@xyfindables.com
 * @Filename: sentinel-launcher.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 27th September 2018 1:48:10 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { promisify } from 'util';

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
  XyoNetworkAddressProvider,
  XyoSignerProvider,
  XyoPacker,
  XyoHashProvider
} from 'xyo-sdk-core';

import { XyoLevelDbStorageProvider } from '../leveldb-storage-provider/level-db-storage-provider';
import { XyoSimpleSentinel } from './xyo-simple-sentinel';

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

  await createSentinel(packer, hashProvider, dataPath, [startingPort], signerProvider);
}

async function createSentinel(
  packer: XyoPacker,
  hashProvider: XyoHashProvider,
  dataPath: string,
  ports: number[],
  signerProvider: XyoSignerProvider
) {
  const sentinelDataPath = path.join(dataPath, String('sentinel'));
  await mkdir(sentinelDataPath, null);
  const xyoSigner = signerProvider.newInstance();
  const originChainStorageProvider = new XyoLevelDbStorageProvider(
    path.join(sentinelDataPath, `origin-chain`)
  );

  const originBlocksStorageProvider = new XyoLevelDbStorageProvider(
    path.join(sentinelDataPath, `origin-blocks`)
  );

  const originBlockNextHashStorageProvider = new XyoLevelDbStorageProvider(
    path.join(sentinelDataPath, `next-hash-index`)
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
      logger.info(`Sentinel: Bound Witness Success. Resting 5 sec`);

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
          logger.info(`Sentinel: Coming back up to speed`);
          resolve();
        }, 5000);
      }) as Promise<void>;
    }
  };

  const sentinel = new XyoSimpleSentinel(
    new SimpleNetworkAddressProvider(ports),
    [xyoSigner],
    hashProvider,
    originChainStateRepository,
    originBlockRepository,
    boundWitnessSuccessListener,
    packer
  );

  sentinel.start();
}

class SimpleNetworkAddressProvider implements XyoNetworkAddressProvider {
  private index = 0;

  constructor(private readonly ports: number[]) {}

  public async next() {
    const port = this.ports[this.index % this.ports.length];
    this.index += 1;
    return {
      host: 'localhost',
      port
    };
  }
}
