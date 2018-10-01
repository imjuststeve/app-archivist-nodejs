/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 11:45:01 am
 * @Email:  developer@xyfindables.com
 * @Filename: simulation.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 28th September 2018 5:36:08 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoSentinelLauncher } from "./sentinel-launcher";
import { XyoArchivistLauncher } from "./archivist-launcher";
import { XyoDefaultPackerProvider, XyoSha256HashProvider, XyoEcSecp256kSignerProvider, XyoPacker, XyoHashProvider, XyoSignerProvider, XyoLogger } from "xyo-sdk-core";
import path from 'path';
import { XyoArchivist } from "./xyo-archivist";

const logger = new XyoLogger();
if (require.main === module) {
  simulate(path.resolve('data'));
}

async function simulate(rootDataPath: string) {
  const sentinelPorts = [9000, 9001, 9002, 9003];
  const packer = new XyoDefaultPackerProvider().getXyoPacker();
  const hashProvider = new XyoSha256HashProvider();
  const signerProvider = new XyoEcSecp256kSignerProvider(hashProvider, 0x06, 0x01, 0x05, 0x01);

  await sentinelPorts.reduce(async (promiseChain, sentinelPort) => {
    await promiseChain;
    const networkAddresses = getNetworkAddresses(sentinelPorts, sentinelPort);
    const sentinelDataPath = getSentinelDataPath(rootDataPath, sentinelPort);
    const sentinelLauncher = new XyoSentinelLauncher({
      packer, hashProvider, dataPath: sentinelDataPath, networkAddresses, signerProvider
    });

    const sentinel = await sentinelLauncher.start();
    logger.info(`Starting sentinel ${sentinelPort}`);

    const innerPromise = sentinel.start();

    await networkAddresses.reduce(async (nestedPromise, networkAddress) => {
      await nestedPromise;
      const innerSentinelDataPath = getSentinelDataPath(rootDataPath, networkAddress.port);
      const innerSentinel = await getOrCreateArchivist(
        networkAddress.port,
        packer,
        hashProvider,
        innerSentinelDataPath,
        signerProvider
      );

      logger.info(`Starting inner-sentinel ${networkAddress.port}`);

      await innerSentinel.start();
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          logger.info(`Stopping inner-sentinel ${networkAddress.port}`);
          await innerSentinel.stop();
          setTimeout(resolve, 1000);
        }, 5000);
      });
    }, innerPromise);

    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        logger.info(`Stopping sentinel ${sentinelPort}`);
        await sentinel.stop();
        logger.info(`Stopped sentinel ${sentinelPort}`);
        setTimeout(resolve, 2000);
      }, 10000);
    }) as Promise<void>;
  }, Promise.resolve() as Promise<void>);
}

function getNetworkAddresses(ports: number[], exclude: number) {
  return ports
    .filter(p => p !== exclude)
    .map((p) => {
      return {
        host: '127.0.0.1',
        port: p
      };
    });
}

function getSentinelDataPath(rootDataPath: string, port: number) {
  return path.join(rootDataPath, `sentinel-${port}`);
}

const archivistsByPort: {[s: string]: XyoArchivist} = {};

async function getOrCreateArchivist(
  port: number,
  packer: XyoPacker,
  hashProvider: XyoHashProvider,
  innerSentinelDataPath: string,
  signerProvider: XyoSignerProvider
) {
  const existingArchivist = archivistsByPort[port];
  if (existingArchivist) {
    return existingArchivist;
  }

  const archivistLauncher = new XyoArchivistLauncher({
    port,
    packer,
    hashProvider,
    dataPath: innerSentinelDataPath,
    signerProvider
  });

  const newArchivist = await archivistLauncher.start();

  archivistsByPort[port] = newArchivist;
  return newArchivist;
}
