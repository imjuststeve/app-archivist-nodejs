/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 10th September 2018 10:30:50 am
 * @Email:  developer@xyfindables.com
 * @Filename: main.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 21st September 2018 9:51:59 am
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
  main(parseInt(process.argv[2], 10));
}

async function main(port: number) {
  const packerProvider = new XyoDefaultPackerProvider();
  const packer = packerProvider.getXyoPacker();
  const network = new XyoServerTcpNetwork(port);

  const catalogue: XyoNetworkProcedureCatalogue = {
    canDo(catalogueItem: CatalogueItem) {
      return catalogueItem === CatalogueItem.BOUND_WITNESS;
    }
  };

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
