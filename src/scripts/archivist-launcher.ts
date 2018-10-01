/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 26th September 2018 1:51:12 pm
 * @Email:  developer@xyfindables.com
 * @Filename: master-simulation.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 1st October 2018 9:34:57 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import path from 'path';

import {
  XyoEcSecp256kSignerProvider,
  XyoSha256HashProvider,
  XyoDefaultPackerProvider,
  XyoOriginChainLocalStorageRepository,
  XyoOriginBlockLocalStorageRepository,
  XyoBoundWitnessSuccessListener,
  XyoSignerProvider,
  XyoPacker,
  XyoHashProvider,
  XyoBase,
  XyoOriginChainStateRepository,
  XyoOriginBlockRepository,
  XyoError
} from 'xyo-sdk-core';

import { XyoArchivist } from '../nodes/xyo-archivist';
import { GraphQLServer } from '../graphql-api/server';
import { GraphqlSchemaBuilder } from '../graphql-api/graphql-schema-builder';
import { GetBlocksByPublicKeyResolver } from '../graphql-api/resolvers/get-blocks-by-public-key-resolver';
import { GetPayloadsFromBlockResolver } from '../graphql-api/resolvers/get-payloads-from-block-resolver';
import { GetPublicKeysFromBlockResolver } from '../graphql-api/resolvers/get-public-keys-from-block-resolver';
import { XyoArchivistLocalStorageRepository } from '../xyo-archivist-repository/xyo-archivist-local-storage-repository';
import { createDirectoryIfNotExists } from '../utils/file-system-utils';

import program from 'commander';
import { getLevelDbStore } from '../utils/leveldb-storage-provider-store';
import { XyoSimpleBoundWitnessSuccessListener } from '../utils/xyo-simple-bound-witness-success-listener';

if (require.main === module) {
  program
    .version('0.1.0')
    .option('-p, --port <n>', 'The TCp port to listen on for connections', parseInt)
    .option('-g, --graphql [n]', 'The http port to listen on for graphql connections', parseInt)
    .option('-d, --data <s>', 'The directory of the data folder')
    .parse(process.argv);

  main(program.data as string, program.port as number, program.graphql as number | undefined);
}

async function main(dataPath: string, port: number, graphqlPort: number | undefined) {
  const hashProvider = new XyoSha256HashProvider();
  const signerProvider = new XyoEcSecp256kSignerProvider(hashProvider, 0x06, 0x01, 0x05, 0x01);
  const packer = new XyoDefaultPackerProvider().getXyoPacker();
  const archivistLauncher = new XyoArchivistLauncher({
    port, graphqlPort, packer, hashProvider, dataPath, signerProvider
  });

  await archivistLauncher.start();
}

export class XyoArchivistLauncher extends XyoBase {

  public static main(argv: string[]) {
    program
    .version('0.1.0')
    .option('-p, --port <n>', 'The TCp port to listen on for connections', parseInt)
    .option('-g, --graphql [n]', 'The http port to listen on for graphql connections', parseInt)
    .option('-d, --data <s>', 'The directory of the data folder')
    .parse(argv);

    main(program.data as string, program.port as number, program.graphql as number | undefined);
  }

  public originChainStateRepository: XyoOriginChainStateRepository | undefined;
  public packer: XyoPacker | undefined;
  public originBlockRepository: XyoOriginBlockRepository | undefined;
  public hashProvider: XyoHashProvider | undefined;
  public boundWitnessSuccessListener: XyoBoundWitnessSuccessListener | undefined;
  public archivist: XyoArchivist | undefined;

  constructor(private readonly options: XyoArchivistLaunchOptions) {
    super();
  }

  public async start() {
    const opts = this.options;
    this.originChainStateRepository = opts.originChainStateRepository;
    this.originBlockRepository = opts.originBlockRepository;
    this.packer = opts.packer || new XyoDefaultPackerProvider().getXyoPacker();
    this.hashProvider = opts.hashProvider || new XyoSha256HashProvider();

    if (opts.dataPath) {
      await createDirectoryIfNotExists(opts.dataPath);
      const originChainStorageProvider = getLevelDbStore(path.join(opts.dataPath, `origin-chain`));
      const originBlocksStorageProvider = getLevelDbStore(path.join(opts.dataPath, `origin-blocks`));
      const originBlockNextHashStorageProvider = getLevelDbStore(path.join(opts.dataPath, `next-hash-index`));

      this.originChainStateRepository = new XyoOriginChainLocalStorageRepository(
        originChainStorageProvider,
        this.packer
      );

      this.originBlockRepository = new XyoOriginBlockLocalStorageRepository(
        this.packer,
        originBlocksStorageProvider,
        originBlockNextHashStorageProvider,
        this.hashProvider
      );
    }

    this.boundWitnessSuccessListener = opts.boundWitnessSuccessListener ||
      new XyoSimpleBoundWitnessSuccessListener(this.packer, this.hashProvider);

    if (!this.originChainStateRepository) {
      throw new XyoError(`Could not resolve OriginChainStateRepository`, XyoError.errorType.ERR_INVALID_PARAMETERS);
    }

    if (!this.originBlockRepository) {
      throw new XyoError(`Could not resolve OriginBlockRepository`, XyoError.errorType.ERR_INVALID_PARAMETERS);
    }

    if (opts.signerProvider && (await this.originChainStateRepository.getSigners()).length === 0) {
      await this.originChainStateRepository.addSigner(opts.signerProvider.newInstance());
    }

    this.archivist = new XyoArchivist(
      opts.port,
      this.hashProvider,
      this.originChainStateRepository,
      this.originBlockRepository,
      this.boundWitnessSuccessListener,
      this.packer
    );

    const archivistRepository = new XyoArchivistLocalStorageRepository(this.originBlockRepository, this.packer);

    if (opts.graphqlPort) {
      new GraphQLServer(
        new GraphqlSchemaBuilder().buildSchema(),
        new GetBlocksByPublicKeyResolver(archivistRepository, this.packer, this.hashProvider),
        new GetPayloadsFromBlockResolver(this.packer, this.hashProvider),
        new GetPublicKeysFromBlockResolver(this.packer, this.hashProvider),
        opts.graphqlPort
      )
      .start();
    }

    return this.archivist;
  }
}

export interface XyoArchivistLaunchOptions {
  port: number;
  graphqlPort?: number;
  packer?: XyoPacker;
  hashProvider?: XyoHashProvider;
  dataPath?: string;
  signerProvider?: XyoSignerProvider;
  originChainStateRepository?: XyoOriginChainStateRepository;
  originBlockRepository?: XyoOriginBlockRepository;
  boundWitnessSuccessListener?: XyoBoundWitnessSuccessListener;
}
