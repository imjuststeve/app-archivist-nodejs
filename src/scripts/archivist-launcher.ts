#!/usr/bin/env node

/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 26th September 2018 1:51:12 pm
 * @Email:  developer@xyfindables.com
 * @Filename: master-simulation.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 4th October 2018 10:48:35 am
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
  XyoBoundWitnessSuccessListener,
  XyoSignerProvider,
  XyoPacker,
  XyoHashProvider,
  XyoBase,
  XyoOriginChainStateRepository,
  XyoOriginBlockRepository,
  XyoError
} from '@xyo-network/sdk-core-nodejs';

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
import { GetAllBlocks } from '../graphql-api/resolvers/get-all-blocks-resolver';

export class XyoArchivistLauncher extends XyoBase {

  public static async main(argv: string[]) {
    program
    .version('0.1.0')
    .option('-p, --port <n>', 'The TCp port to listen on for connections', parseInt)
    .option('-g, --graphql [n]', 'The http port to listen on for graphql connections', parseInt)
    .option('-d, --data <s>', 'The directory of the data folder')
    .parse(argv);

    const hashProvider = new XyoSha256HashProvider();
    const signerProvider = new XyoEcdsaSecp256k1Sha256SignerProvider(hashProvider);
    const packer = new XyoDefaultPackerProvider().getXyoPacker();
    const archivistLauncher = new XyoArchivistLauncher({
      port: program.port as number,
      graphqlPort: program.graphql as number | undefined,
      packer,
      hashProvider,
      dataPath: program.data as string,
      signerProvider
    });

    const archivist = await archivistLauncher.start();
    archivist.start();
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
        originBlockNextHashStorageProvider
      );
    }

    if (!this.originChainStateRepository) {
      throw new XyoError(`Could not resolve OriginChainStateRepository`, XyoError.errorType.ERR_INVALID_PARAMETERS);
    }

    if (!this.originBlockRepository) {
      throw new XyoError(`Could not resolve OriginBlockRepository`, XyoError.errorType.ERR_INVALID_PARAMETERS);
    }

    if (opts.signerProvider) {
      if ((await this.originChainStateRepository.getSigners()).length === 0) {
        await this.originChainStateRepository.setCurrentSigners([opts.signerProvider.newInstance()]);
      }

      if (!(await this.originChainStateRepository.getNextPublicKey())) {
        await this.originChainStateRepository.addSigner(opts.signerProvider.newInstance());
      }
    }

    const publicKeys = (await this.originChainStateRepository.getSigners())
      .map((signer) => {
        return this.packer!.serialize(
          signer.publicKey,
          signer.publicKey.major,
          signer.publicKey.minor,
          true
        ).toString('hex');
      }).join(', ');

    const nextPublicKey = (await this.originChainStateRepository.getNextPublicKey());
    const nextPublicKeyString = nextPublicKey ?
      this.packer!.serialize(
        nextPublicKey.publicKey,
        nextPublicKey.publicKey.major,
        nextPublicKey.publicKey.minor,
        true
      ).toString('hex') :
      'undefined';

    this.logInfo(`Start archivist with public keys ${publicKeys} and next public key ${nextPublicKeyString}`);

    this.boundWitnessSuccessListener = opts.boundWitnessSuccessListener || new XyoSimpleBoundWitnessSuccessListener(
      this.packer,
      this.hashProvider,
      this.originChainStateRepository,
      opts.signerProvider
    );

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
        await new GraphqlSchemaBuilder().buildSchema(),
        new GetBlocksByPublicKeyResolver(archivistRepository, this.packer, this.hashProvider),
        new GetPayloadsFromBlockResolver(this.packer, this.hashProvider),
        new GetPublicKeysFromBlockResolver(this.packer, this.hashProvider),
        new GetAllBlocks(archivistRepository, this.packer, this.hashProvider),
        opts.graphqlPort
      )
      .start();
    }

    return this.archivist;
  }
}

if (require.main === module) {
  XyoArchivistLauncher.main(process.argv);
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
