/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 10th September 2018 10:30:50 am
 * @Email:  developer@xyfindables.com
 * @Filename: main.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 24th September 2018 11:32:23 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company`
 */

import {
  XyoNode,
  XyoDefaultPackerProvider,
  XyoServerTcpNetwork,
  XyoNetworkProcedureCatalogue,
  CatalogueItem,
  XyoFileSystemStorageProvider,
  XyoRSASha256SignerProvider,
  XyoSigner,
  XyoSha256HashProvider,
  XyoPeerConnectionProviderFactory,
  XyoBoundWitnessPayloadProviderImpl,
  XyoOriginBlockLocalStorageRepository,
  XyoOriginChainLocalStorageRepository
} from '../../../sdk-core-nodejs';

import path from 'path';

const logger = console;

if (require.main === module) {
  process.on('unhandledRejection', (error) => {
    // Will print "unhandledRejection err is not defined"
    logger.log(`unhandledRejection ${process.argv[2]}`, error.message);
  });

  process.on('uncaughtException', (error) => {
    // Will print "unhandledRejection err is not defined"
    logger.log(`uncaughtException ${process.argv[2]}`, error.message);
  });

  main(process.argv[2], parseInt(process.argv[3], 10));
}

async function main(dataDirectory: string, port: number) {
  const packerProvider = new XyoDefaultPackerProvider();
  const packer = packerProvider.getXyoPacker();
  const network = new XyoServerTcpNetwork(port);

  const catalogue: XyoNetworkProcedureCatalogue = {
    canDo(catalogueItem: CatalogueItem) {
      return catalogueItem === CatalogueItem.BOUND_WITNESS;
    }
  };

  const originBlocksStorageProvider = new XyoFileSystemStorageProvider(
    path.join(dataDirectory, `origin-blocks`),
    'hex'
  );

  const originBlockNextHashStorageProvider = new XyoFileSystemStorageProvider(
    path.join(dataDirectory, `next-hash-index`),
    'hex'
  );

  const originChainStorageProvider = new XyoFileSystemStorageProvider(
    path.join(dataDirectory, `origin-chain`),
    'utf8'
  );

  const hashingProvider = new XyoSha256HashProvider();
  const signerProvider = new XyoRSASha256SignerProvider();
  const signers: XyoSigner[] = [signerProvider.newInstance()];

  const originChainStateManager = new XyoOriginChainLocalStorageRepository(originChainStorageProvider, packer);
  const originChainNavigator = new XyoOriginBlockLocalStorageRepository(
    packer,
    originBlocksStorageProvider,
    originBlockNextHashStorageProvider,
    hashingProvider
  );
  const boundWitnessPayloadProvider = new XyoBoundWitnessPayloadProviderImpl();

  const peerConnectionDelegateFactory = new XyoPeerConnectionProviderFactory(
    network,
    catalogue,
    packer,
    signers,
    hashingProvider,
    originChainStateManager,
    originChainNavigator,
    boundWitnessPayloadProvider
  );

  const archivist = new XyoNode(peerConnectionDelegateFactory.newInstance());
  archivist.start();
}
