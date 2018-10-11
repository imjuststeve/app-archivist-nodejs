#!/usr/bin / env; node;

/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 27th September 2018 1:04:07 pm
 * @Email:  developer@xyfindables.com
 * @Filename: sentinel-launcher.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 11th October 2018 2:35:06 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import path from 'path';

import {
  XyoEcdsaSecp256k1Sha256SignerProvider,
  XyoSha256HashProvider,
  XyoDefaultPackerProvider,
  XyoOriginChainLocalStorageRepository,
  XyoOriginBlockLocalStorageRepository,
  IXyoBoundWitnessSuccessListener,
  IXyoSignerProvider,
  XyoPacker,
  IXyoHashProvider,
  IXyoNetworkProcedureCatalogue,
  IXyoStorageProvider,
  IXyoOriginChainStateRepository,
  IXyoOriginBlockRepository,
  XyoError,
  XyoErrors,
  IXyoNetworkAddressProvider,
  XyoBase,
  XyoLogger
} from '@xyo-network/sdk-core-nodejs';

import { XyoSimpleSentinel } from '../nodes/xyo-simple-sentinel';
import { createDirectoryIfNotExists } from '../utils/file-system-utils';
import { XyoSimpleNetworkAddressProvider } from '../utils/xyo-simple-network-address-provider';
import { getLevelDbStore } from '../utils/leveldb-storage-provider-store';

import { XyoSimpleSentinelNetworkProcedureCatalogue } from '../utils/xyo-simple-sentinel-network-procedure-catalogue';
import { XyoSimpleBoundWitnessSuccessListener } from '../utils/xyo-simple-bound-witness-success-listener';

import program from 'commander';

export class XyoSentinelLauncher extends XyoBase {

  public static async main(argv: string[]) {
    const logger = new XyoLogger();
    process.on('uncaughtException', (exception) => {
      logger.error(`There was an uncaught exception ${exception}. Will exit`);
      process.exit(-1);
    });

    process.on('unhandledRejection', (exception) => {
      logger.error(`There was an unhandled rejection ${exception}. Will exit`);
      process.exit(-1);
    });

    program
      .version('0.1.0')
      .option(
        '-a, --addresses <n>', 'A comma-separated list of the addresses of other nodes',
        (val: string) => val.split(','),
        '127.0.0.1:11000'
      )
      .option('-d, --data <s>', 'The directory of the data folder', './sentinel-db')
      .parse(argv);

    const dataPath: string = program.data;
    const addresses: string[] = program.addresses;

    const networkAddresses = addresses.map((address) => {
      const parts = address.split(':');
      return {
        host: parts[0],
        port: parseInt(parts[1], 10)
      };
    });

    const hashProvider = new XyoSha256HashProvider();
    const signerProvider = new XyoEcdsaSecp256k1Sha256SignerProvider(hashProvider);
    const packer = new XyoDefaultPackerProvider().getXyoPacker();
    const sentinelLaunch = new XyoSentinelLauncher({
      packer,
      hashProvider,
      dataPath,
      networkAddresses,
      signerProvider
    });

    const sentinel = await sentinelLaunch.start();
    sentinel.start();
  }

  public addressProvider: IXyoNetworkAddressProvider | undefined;
  public hashProvider: IXyoHashProvider | undefined;
  public originChainStateRepository: IXyoOriginChainStateRepository | undefined;
  public originBlockRepository: IXyoOriginBlockRepository | undefined;
  public successListener: IXyoBoundWitnessSuccessListener | undefined;
  public packer: XyoPacker | undefined;
  public networkProcedureCatalogue: IXyoNetworkProcedureCatalogue | undefined;
  public sentinel: XyoSimpleSentinel | undefined;

  constructor(private readonly options: XyoSentinelLauncherOptions) {
    super();
  }

  public async start() {
    const opts = this.options;
    this.originChainStateRepository = opts.originChainStateRepository;
    let originBlocksStorageProvider: IXyoStorageProvider;
    let originBlockNextHashStorageProvider: IXyoStorageProvider;
    this.originBlockRepository = opts.originBlockRepository;
    this.packer = opts.packer || new XyoDefaultPackerProvider().getXyoPacker();

    this.hashProvider = opts.hashProvider || new XyoSha256HashProvider();

    if (opts.dataPath) {
      await createDirectoryIfNotExists(opts.dataPath);
      const originChainStorageProvider = getLevelDbStore(path.join(opts.dataPath, `origin-chain`));
      this.originChainStateRepository = new XyoOriginChainLocalStorageRepository(
        originChainStorageProvider,
        this.packer
      );
      originBlocksStorageProvider = getLevelDbStore(path.join(opts.dataPath, `origin-blocks`));
      originBlockNextHashStorageProvider = getLevelDbStore(path.join(opts.dataPath, `next-hash-index`));
      this.originBlockRepository = new XyoOriginBlockLocalStorageRepository(
        this.packer,
        originBlocksStorageProvider,
        originBlockNextHashStorageProvider
      );
    }

    if (opts.originBlocksStorageProvider && opts.originBlockNextHashStorageProvider) {
      this.originBlockRepository = new XyoOriginBlockLocalStorageRepository(
        this.packer,
        opts.originBlocksStorageProvider,
        opts.originBlockNextHashStorageProvider
      );
    }

    if (!this.originChainStateRepository) {
      throw new XyoError(`Could not resolve OriginChainStateRepository`, XyoErrors.INVALID_PARAMETERS);
    }

    if (!this.originBlockRepository) {
      throw new XyoError(`Could not resolve OriginBlockRepository`, XyoErrors.INVALID_PARAMETERS);
    }

    if (opts.signerProvider && (await this.originChainStateRepository.getSigners()).length === 0) {
      await this.originChainStateRepository.addSigner(opts.signerProvider.newInstance());
    }

    this.networkProcedureCatalogue = opts.catalogue || new XyoSimpleSentinelNetworkProcedureCatalogue();
    this.addressProvider = opts.networkAddressProvider;

    if (!this.addressProvider && opts.networkAddresses) {
      this.addressProvider = new XyoSimpleNetworkAddressProvider(opts.networkAddresses);
    } else {
      throw new XyoError(`Could not resolve AddressProvider`, XyoErrors.INVALID_PARAMETERS);
    }

    this.successListener = opts.boundWitnessSuccessListener ||
      new XyoSimpleBoundWitnessSuccessListener(
        this.packer,
        this.hashProvider,
        this.originChainStateRepository,
        opts.signerProvider
      );

    this.sentinel = new XyoSimpleSentinel(
      this.addressProvider,
      this.hashProvider,
      this.originChainStateRepository,
      this.originBlockRepository,
      this.successListener,
      this.packer,
      this.networkProcedureCatalogue
    );

    return this.sentinel;
  }
}

if (require.main === module) {
  XyoSentinelLauncher.main(process.argv);
}

export interface XyoSentinelLauncherOptions {
  packer?: XyoPacker;
  hashProvider?: IXyoHashProvider;
  dataPath?: string;
  signerProvider?: IXyoSignerProvider;
  catalogue?: IXyoNetworkProcedureCatalogue;
  boundWitnessSuccessListener?: IXyoBoundWitnessSuccessListener;
  originBlockRepository?: IXyoOriginBlockRepository;
  originChainStateRepository?: IXyoOriginChainStateRepository;
  originBlocksStorageProvider?: IXyoStorageProvider;
  originBlockNextHashStorageProvider?: IXyoStorageProvider;
  networkAddresses: Array<{port: number, host: string}>; // tslint:disable-line:prefer-array-literal
  networkAddressProvider?: IXyoNetworkAddressProvider;
}
